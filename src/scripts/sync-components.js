const mysql = require('mysql2/promise');
const fetch = require('node-fetch');

class ComponentSyncService {
  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
  }

  async getDbConnection() {
    return await mysql.createConnection(this.dbConfig);
  }

  async logSyncStart(connection) {
    const [result] = await connection.execute(
      'INSERT INTO component_sync_logs (sync_started_at) VALUES (CURRENT_TIMESTAMP)'
    );
    return result.insertId;
  }

  async logSyncEnd(connection, syncLogId, stats, error = null) {
    const query = error 
      ? `UPDATE component_sync_logs 
         SET sync_status = 'failed', error_message = ?, 
             sync_completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      : `UPDATE component_sync_logs 
         SET sync_completed_at = CURRENT_TIMESTAMP, 
             components_added = ?, components_updated = ?, 
             sync_status = 'completed'
         WHERE id = ?`;

    const params = error 
      ? [error, syncLogId]
      : [stats.added, stats.updated, syncLogId];

    await connection.execute(query, params);
  }

  async fetchDataPacketComponents() {
    const startTime = Date.now();
    
    try {
      // Replace with your actual DataPacket API endpoint and auth
      const response = await fetch(process.env.DATAPACKET_API_URL || 'https://api.datapacket.com/v1/components', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.DATAPACKET_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'YourApp/1.0'
        },
        timeout: 30000 // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`DataPacket API responded with status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      console.log(`DataPacket API responded in ${responseTime}ms`);
      
      return {
        data,
        responseTime
      };

    } catch (error) {
      console.error('Failed to fetch from DataPacket API:', error);
      throw new Error(`DataPacket API Error: ${error.message}`);
    }
  }

  async syncComponent(connection, component, type) {
    // Check if component exists
    const [existing] = await connection.execute(
      'SELECT id, datapacket_data, is_enabled, custom_name, custom_price, admin_notes FROM components WHERE id = ?',
      [component.id]
    );

    const componentData = {
      id: component.id,
      name: component.name,
      type: type,
      base_price: component.base_price || 0,
      specs: component.specs ? JSON.stringify(component.specs) : null,
      datapacket_data: JSON.stringify(component),
      datapacket_updated_at: new Date()
    };

    if (existing.length === 0) {
      // New component - add as disabled by default
      await connection.execute(
        `INSERT INTO components 
         (id, name, type, base_price, specs, datapacket_data, is_enabled, 
          first_seen_at, datapacket_updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP, ?)`,
        [
          componentData.id,
          componentData.name,
          componentData.type,
          componentData.base_price,
          componentData.specs,
          componentData.datapacket_data,
          componentData.datapacket_updated_at
        ]
      );
      
      console.log(`Added new component: ${component.name} (${type})`);
      return 'added';

    } else {
      // Check if component data has actually changed
      const existingData = existing[0].datapacket_data;
      const hasChanges = JSON.stringify(component) !== existingData;

      if (hasChanges) {
        // Update existing component (preserve admin settings)
        await connection.execute(
          `UPDATE components 
           SET name = ?, base_price = ?, specs = ?, datapacket_data = ?, 
               datapacket_updated_at = ?, last_updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            componentData.name,
            componentData.base_price,
            componentData.specs,
            componentData.datapacket_data,
            componentData.datapacket_updated_at,
            componentData.id
          ]
        );

        console.log(`Updated component: ${component.name} (${type})`);
        return 'updated';
      }

      return 'unchanged';
    }
  }

  async markUnavailableComponents(connection, activeComponentIds) {
    // Mark components as unavailable if they're not in the latest API response
    // but don't delete them in case they come back
    const placeholders = activeComponentIds.map(() => '?').join(',');
    const query = activeComponentIds.length > 0 
      ? `UPDATE components 
         SET datapacket_data = JSON_SET(datapacket_data, '$.available', false),
             last_updated_at = CURRENT_TIMESTAMP
         WHERE id NOT IN (${placeholders})`
      : `UPDATE components 
         SET datapacket_data = JSON_SET(datapacket_data, '$.available', false),
             last_updated_at = CURRENT_TIMESTAMP`;

    const [result] = await connection.execute(query, activeComponentIds);
    
    if (result.affectedRows > 0) {
      console.log(`Marked ${result.affectedRows} components as unavailable`);
    }

    return result.affectedRows;
  }

  async syncComponents() {
    const connection = await this.getDbConnection();
    let syncLogId;

    try {
      // Start sync logging
      syncLogId = await this.logSyncStart(connection);
      console.log(`Starting component sync (Log ID: ${syncLogId})`);

      // Fetch data from DataPacket API
      const { data: apiData, responseTime } = await this.fetchDataPacketComponents();

      // Track statistics
      const stats = {
        added: 0,
        updated: 0,
        unchanged: 0,
        unavailable: 0
      };

      const activeComponentIds = [];

      // Process each component type
      const componentTypes = ['cpu', 'memory', 'storage', 'location', 'operatingSystems'];
      
      for (const type of componentTypes) {
        const components = apiData[type] || [];
        console.log(`Processing ${components.length} ${type} components`);

        for (const component of components) {
          activeComponentIds.push(component.id);
          
          const result = await this.syncComponent(connection, component, type);
          
          if (result === 'added') {
            stats.added++;
          } else if (result === 'updated') {
            stats.updated++;
          } else {
            stats.unchanged++;
          }
        }
      }

      // Mark unavailable components
      stats.unavailable = await this.markUnavailableComponents(connection, activeComponentIds);

      // Update API response time in log
      await connection.execute(
        'UPDATE component_sync_logs SET api_response_time_ms = ? WHERE id = ?',
        [responseTime, syncLogId]
      );

      // Complete sync logging
      await this.logSyncEnd(connection, syncLogId, stats);

      console.log('Sync completed successfully:', stats);
      return stats;

    } catch (error) {
      console.error('Sync failed:', error);
      
      if (syncLogId) {
        await this.logSyncEnd(connection, syncLogId, null, error.message);
      }
      
      throw error;
    } finally {
      await connection.end();
    }
  }
}

// CLI usage
if (require.main === module) {
  const syncService = new ComponentSyncService();
  
  syncService.syncComponents()
    .then(stats => {
      console.log('Sync completed:', stats);
      process.exit(0);
    })
    .catch(error => {
      console.error('Sync failed:', error);
      process.exit(1);
    });
}

module.exports = ComponentSyncService;