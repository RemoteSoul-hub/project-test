// app/api/admin/components/route.js
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection - adjust to your setup
const getDbConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

// GET: Fetch all components with admin configurations
// This function handles GET requests to retrieve a list of components from the database.
// It supports filtering, searching, pagination, and complex availability logic.
export async function GET(request) {
  try {
    // 1. Extract Query Parameters
    // Get search parameters from the request URL.
    const { searchParams } = new URL(request.url);

    // Extract individual query parameters.
    const type = searchParams.get('type'); // Filter by component type (e.g., 'CPU', 'GPU')
    const enabled = searchParams.get('enabled'); // Filter by 'is_enabled' status (e.g., 'true', 'false')
    const availability = searchParams.get('availability'); // Filter by availability status (e.g., 'available', 'out_of_stock', 'not_in_datapacket')
    const search = searchParams.get('search'); // Search term for name, custom_name, admin_notes

    // Parse pagination parameters, defaulting to page 1 and limit 50 if not provided.
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = (page - 1) * limit; // Calculate the offset for SQL LIMIT clause

    // 2. Establish Database Connection
    // Get a database connection instance. Assumes 'getDbConnection' is an async function
    // that returns a database connection object.
    const connection = await getDbConnection();

    // 3. Build WHERE Clause for SQL Query
    // Initialize arrays to store WHERE conditions and their corresponding parameters.
    let whereConditions = [];
    let params = [];

    // Add type filter condition if 'type' parameter is present.
    if (type) {
      whereConditions.push('type = ?');
      params.push(type);
    }

    // Add 'is_enabled' filter condition if 'enabled' parameter is present.
    // 'enabled' can be 'true' or 'false', so convert it to a boolean.
    if (enabled !== null && enabled !== undefined) {
      whereConditions.push('is_enabled = ?');
      params.push(enabled === 'true');
    }

    // Add availability filtering logic based on the 'availability' parameter.
    if (availability) {
      switch (availability) {
        case 'available':
          // A component is considered 'available' if:
          // 1. Its 'stockCount' in 'specs' JSON is NULL or greater than 0, AND
          // 2. Its 'available' status in 'datapacket_data' JSON is 1 (or defaults to 1 if NULL).
          whereConditions.push('(JSON_EXTRACT(specs, "$.stockCount") IS NULL OR JSON_EXTRACT(specs, "$.stockCount") > 0)');
          whereConditions.push('COALESCE(JSON_EXTRACT(datapacket_data, "$.available"), 1) = 1');
          break;
        case 'out_of_stock':
          // A component is 'out_of_stock' if its 'stockCount' in 'specs' JSON is exactly 0.
          whereConditions.push('JSON_EXTRACT(specs, "$.stockCount") = 0');
          break;
        case 'not_in_datapacket':
          // A component is 'not_in_datapacket' if its 'available' status in 'datapacket_data' JSON is 0.
          // COALESCE handles cases where datapacket_data or $.available might be null, treating them as 1 (available by default).
          // So, to find 'not_in_datapacket', we look for when this coalesced value is 0.
          whereConditions.push('COALESCE(JSON_EXTRACT(datapacket_data, "$.available"), 1) = 0');
          break;
      }
    }

    // Add search condition if 'search' parameter is present.
    // It searches across 'name', 'custom_name', and 'admin_notes' fields using LIKE for partial matches.
    if (search) {
      whereConditions.push('(name LIKE ? OR custom_name LIKE ? OR admin_notes LIKE ?)');
      const searchTerm = `%${search}%`; // Add wildcards for LIKE operator
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Combine all WHERE conditions into a single string.
    // If no conditions, the clause remains empty.
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 4. Get Total Count of Components
    // Query to get the total number of components matching the WHERE clause.
    const countQuery = `SELECT COUNT(*) as total FROM components ${whereClause}`;
    // Execute the count query. The result is an array, so destructure to get the first element.
    const [countResult] = await connection.execute(countQuery, params);
    const total = countResult[0].total; // Extract the total count

    // 5. Get Paginated Results with Availability Logic
    // Query to fetch the actual component data with pagination and availability-related fields.
    const dataQuery = `
      SELECT
        id,
        name,
        type,
        base_price,
        specs,           
        is_enabled,
        admin_notes,
        custom_name,
        custom_price,
        sort_order,
        first_seen_at,
        last_updated_at,
        datapacket_updated_at,
        -- Extract 'available' status from 'datapacket_data' JSON.
        -- COALESCE ensures a default value of 1 (true) if the field is null.
        COALESCE(JSON_EXTRACT(datapacket_data, '$.available'), 1) as datapacket_available,
        -- Extract 'stockCount' from 'specs' JSON.
        -- COALESCE ensures a default value of 1 if the field is null (meaning infinite/unknown stock).
        COALESCE(JSON_EXTRACT(specs, '$.stockCount'), 1) as stock_count,
        -- Determine 'in_stock' status based on 'stockCount'.
        -- If 'stockCount' is not null, 'in_stock' is true if stockCount > 0, else false.
        -- If 'stockCount' is null, 'in_stock' defaults to true (unknown/infinite stock).
        CASE
          WHEN JSON_EXTRACT(specs, '$.stockCount') IS NOT NULL
          THEN JSON_EXTRACT(specs, '$.stockCount') > 0
          ELSE 1
        END as in_stock
      FROM components
      ${whereClause}
      ORDER BY sort_order ASC, type ASC, name ASC 
      LIMIT ? OFFSET ? 
    `;

    // Add limit and offset to the parameters for the data query.
    params.push(limit, offset);
    // Execute the data query.
    const [rows] = await connection.execute(dataQuery, params);

    // 6. Format the Response with Availability Logic and JSON Parsing
    // Map over the database rows to format each component object.
    const components = rows.map(row => {
      try {
        return {
          ...row, // Spread existing row properties
          // Safely parse the 'specs' JSON string into a JavaScript object.
          specs: row.specs ? JSON.parse(row.specs) : null,
          // FIX: Safely parse the 'datapacket_data' JSON string into a JavaScript object.
          datapacket_data: row.datapacket_data ? JSON.parse(row.datapacket_data) : null,

          // Convert 'datapacket_available' and 'in_stock' (which come as 0 or 1 from SQL) to proper booleans.
          datapacket_available: row.datapacket_available === 1 || row.datapacket_available === true,
          in_stock: row.in_stock === 1 || row.in_stock === true,
          // Ensure 'stock_count' is an integer.
          stock_count: parseInt(row.stock_count) || 0,
          // Determine the overall 'is_available' status. A component is available if it's
          // either 'in_stock' OR 'datapacket_available'.
          is_available: (row.in_stock === 1 || row.in_stock === true) || (row.datapacket_available === 1 || row.datapacket_available === true)
        };
      } catch (e) {
        // Log an error if JSON parsing fails for a specific component.
        console.error(`Failed to parse JSON for component ID: ${row.id}`, e);
        // Return a fallback object with an error message for the JSON fields.
        return { ...row, specs: { error: 'Invalid JSON format' }, datapacket_data: { error: 'Invalid JSON format' } };
      }
    });

    // 7. Close Database Connection
    // Release the database connection.
    await connection.end();

    // 8. Send JSON Response
    // Return a JSON response containing the fetched data and pagination metadata.
    return NextResponse.json({
      data: components,
      meta: {
        total, // Total number of matching components
        page,  // Current page number
        limit, // Number of items per page
        totalPages: Math.ceil(total / limit) // Total number of pages
      }
    });

  } catch (error) {
    // 9. Handle Errors
    // If any error occurs during the process, log it and return a 500 status code.
    console.error('Error fetching admin components:', error);
    return NextResponse.json(
      { error: 'Failed to fetch components' },
      { status: 500 } // Internal Server Error
    );
  }
}

// DELETE: Reset all components (dangerous operation)
export async function DELETE(request) {
  try {
    const { confirmReset } = await request.json();

    if (!confirmReset) {
      return NextResponse.json(
        { error: 'Reset confirmation required' },
        { status: 400 }
      );
    }

    const connection = await getDbConnection();

    // Get count before deletion for logging
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM components');
    const totalComponents = countResult[0].total;

    // Delete all components
    const [deleteResult] = await connection.execute('DELETE FROM components');
    
    // Skip logging for bulk operations to avoid foreign key constraint issues
    const adminUserId = 1; // Replace with actual admin user ID from authentication
    console.log(`🗑️ Database reset by admin user ${adminUserId} - Deleted ${totalComponents} components`);

    await connection.end();

    console.log(`🗑️ Database reset completed - Deleted ${totalComponents} components`);

    return NextResponse.json({ 
      success: true, 
      deletedCount: totalComponents,
      message: `Successfully deleted ${totalComponents} components`
    });

  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { error: 'Failed to reset database', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update component admin settings
export async function PATCH(request) {
  try {
    const { id, updates } = await request.json();

    if (!id || !updates) {
      return NextResponse.json(
        { error: 'Component ID and updates are required' },
        { status: 400 }
      );
    }

    const connection = await getDbConnection();

    // Get current component data for logging
    const [currentData] = await connection.execute(
      'SELECT * FROM components WHERE id = ?',
      [id]
    );

    if (currentData.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    // Build update query
    const allowedFields = ['is_enabled', 'admin_notes', 'custom_name', 'custom_price', 'sort_order', 'specs'];
    const updateFields = [];
    const updateValues = [];

for (const [field, value] of Object.entries(updates)) {
  if (allowedFields.includes(field)) {
    if (field === 'specs') {
      // specs comes as JSON string from frontend
      updateFields.push(`${field} = ?`);
      updateValues.push(value);
    } else {
      updateFields.push(`${field} = ?`);
      updateValues.push(value);
    }
  }
}

    if (updateFields.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updateValues.push(id);

    const updateQuery = `
      UPDATE components 
      SET ${updateFields.join(', ')}, last_updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await connection.execute(updateQuery, updateValues);

    // Log the admin action (you'll need to get admin user ID from session/auth)
    const adminUserId = 1; // Replace with actual admin user ID from authentication

    const logAction = updates.is_enabled !== undefined ?
      (updates.is_enabled ? 'enabled' : 'disabled') : 'updated';

    await connection.execute(
      `INSERT INTO component_admin_logs 
       (component_id, admin_user_id, action, old_values, new_values) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        adminUserId,
        logAction,
        JSON.stringify(currentData[0]),
        JSON.stringify(updates)
      ]
    );

    await connection.end();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating component:', error);
    return NextResponse.json(
      { error: 'Failed to update component' },
      { status: 500 }
    );
  }
}

// Helper functions for OS syncing
const generateOSId = (osName) => {
  return osName.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
};

const extractArchitecture = (osName) => {
  const name = osName.toLowerCase();

  // Look for version numbers and architecture hints
  if (name.includes('64') || name.includes('x64') || name.includes('amd64')) {
    return '64bit';
  }
  if (name.includes('32') || name.includes('x86') || name.includes('i386')) {
    return '32bit';
  }
  if (name.includes('arm64') || name.includes('aarch64')) {
    return 'ARM64';
  }
  if (name.includes('arm')) {
    return 'ARM';
  }

  // Extract version numbers (e.g., "Ubuntu 22.04" -> "22.x 64bit")
  const versionMatch = name.match(/(\d+)\.?(\d*)/);
  if (versionMatch) {
    const major = versionMatch[1];
    return `${major}.x 64bit`;
  }

  return '64bit';
};

const determineOSProperties = (osName) => {
  const name = (osName || '').toLowerCase();
  
  // OS Detection patterns - order matters (most specific first)
  const osPatterns = [
    {
      patterns: ['windows', 'win'],
      props: {
        icon: 'windowsOS.svg',
        category: 'windows',
        brandColor: '#0078D4'
      }
    },
    {
      patterns: ['ubuntu'],
      props: {
        icon: 'ubuntuOS.svg',
        category: 'ubuntu', 
        brandColor: '#E95420'
      }
    },
    {
      patterns: ['debian'],
      props: {
        icon: 'debianOS.svg',
        category: 'debian',
        brandColor: '#A81D33'
      }
    },
    {
      patterns: ['centos', 'cent'],
      props: {
        icon: 'centOS.svg',
        category: 'centos',
        brandColor: '#932279'
      }
    },
    {
      patterns: ['almalinux', 'alma'],
      props: {
        icon: 'almalinuxOS.svg',
        category: 'almalinux',
        brandColor: '#0F4266'
      }
    },
    {
      patterns: ['rocky'],
      props: {
        icon: 'otherOS.svg',
        category: 'rocky',
        brandColor: '#10B981'
      }
    },
    {
      patterns: ['fedora'],
      props: {
        icon: 'otherOS.svg',
        category: 'fedora',
        brandColor: '#294172'
      }
    },
    {
      patterns: ['rhel', 'red hat'],
      props: {
        icon: 'otherOS.svg',
        category: 'rhel',
        brandColor: '#EE0000'
      }
    },
    {
      patterns: ['suse', 'opensuse'],
      props: {
        icon: 'otherOS.svg',
        category: 'suse',
        brandColor: '#73BA25'
      }
    },
    {
      patterns: ['arch'],
      props: {
        icon: 'otherOS.svg',
        category: 'arch',
        brandColor: '#1793D1'
      }
    },
    {
      patterns: ['oracle'],
      props: {
        icon: 'otherOS.svg',
        category: 'oracle',
        brandColor: '#F80000'
      }
    },
    {
      patterns: ['linux'],
      props: {
        icon: 'otherOS.svg',
        category: 'linux',
        brandColor: '#8B5CF6'
      }
    }
  ];

  const matchedOS = osPatterns.find(os => 
    os.patterns.some(pattern => name.includes(pattern))
  );

  const defaultProps = {
    icon: 'otherOS.svg',
    category: 'other',
    brandColor: '#6B7280'
  };

  const osProps = matchedOS ? matchedOS.props : defaultProps;

  return {
    ...osProps,
    arch: extractArchitecture(name)
  };
};

const syncOperatingSystemsFromAPI = async (connection, requestHeaders) => {
  console.log('🔧 Syncing operating systems from DataPacket API...');
  
  try {
    // Query DataPacket API for operating systems
const osQuery = {
  query: `
    query {
      operatingSystems {
        osImageId
        name
      }
    }
  `
};

    console.log('🖥️ Fetching operating systems from DataPacket API...');
    
    const osResponse = await fetch(process.env.DATAPACKET_API_URL, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(osQuery)
    });

if (!osResponse.ok) {
  const errorText = await osResponse.text();
  console.error('🖥️ OS API Error Response:', errorText);
  console.error('🖥️ OS API Status:', osResponse.status);
  console.error('🖥️ OS Query sent:', JSON.stringify(osQuery, null, 2));
  throw new Error(`DataPacket OS API error: ${osResponse.status} - ${errorText}`);
}

    const osApiData = await osResponse.json();
    console.log('🖥️ OS API Response:', JSON.stringify(osApiData, null, 2));

    const operatingSystems = osApiData.data?.operatingSystems || [];
    console.log(`🖥️ Found ${operatingSystems.length} operating systems from API`);

    let osAdded = 0;
    let osUpdated = 0;

    for (const osData of operatingSystems) {
      const osId = osData.osImageId;
      const osProperties = determineOSProperties(osData.name);
      
      const specs = {
        osImageId: osId,
        description: osData.description || osData.name,
        version: osData.version,
        architecture: osData.architecture || osProperties.arch,
        ...osProperties
      };

      const datapacketData = {
        ...osData,
        id: osId,
        available: true,
        type: 'operatingSystems'
      };

      try {
        // Check if OS exists
        const [existingRecord] = await connection.execute(
          'SELECT id, type, custom_name FROM components WHERE id = ?',
          [osId]
        );

        if (existingRecord.length === 0) {
          // New OS - add as enabled by default
          await connection.execute(
            `INSERT INTO components 
             (id, name, type, base_price, specs, datapacket_data, is_enabled, datapacket_updated_at, first_seen_at) 
             VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, CURRENT_TIMESTAMP)`,
            [
              osId,
              osData.name,
              'operatingSystems',
              0, // OS don't have individual pricing
              JSON.stringify(specs),
              JSON.stringify(datapacketData),
              new Date()
            ]
          );
          osAdded++;
          console.log(`✅ Added OS from API: ${osData.name} (${osId})`);
        } else {
          // Update existing OS but preserve custom name if set
          const hasCustomName = existingRecord[0].custom_name !== null;
          
          if (hasCustomName) {
            // Keep custom name, update everything else including type
            await connection.execute(
              `UPDATE components 
               SET type = ?, specs = ?, datapacket_data = ?, 
                   datapacket_updated_at = ?, last_updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [
                'operatingSystems',
                JSON.stringify(specs),
                JSON.stringify(datapacketData),
                new Date(),
                osId
              ]
            );
          } else {
            // Update everything including type and name
            await connection.execute(
              `UPDATE components 
               SET name = ?, type = ?, specs = ?, datapacket_data = ?, 
                   datapacket_updated_at = ?, last_updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [
                osData.name,
                'operatingSystems',
                JSON.stringify(specs),
                JSON.stringify(datapacketData),
                new Date(),
                osId
              ]
            );
          }
          osUpdated++;
          console.log(`🔄 Updated OS from API: ${osData.name} (${osId})`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing OS ${osId}:`, error.message);
      }
    }

    console.log(`🔧 API OS sync completed - Added: ${osAdded}, Updated: ${osUpdated}`);
    return { osAdded, osUpdated };
    
  } catch (error) {
    console.error('Error fetching operating systems from API:', error);
    // Return zero counts instead of throwing to avoid breaking the main sync
    return { osAdded: 0, osUpdated: 0 };
  }
};

// POST: Sync components from DataPacket API (called by cron job)
export async function POST(request) {
  try {
    console.log('🔧 Debug: Checking environment variables...');
    console.log('DATAPACKET_API_URL exists:', !!process.env.DATAPACKET_API_URL);
    console.log('DATAPACKET_API_KEY exists:', !!process.env.DATAPACKET_API_KEY);

    const connection = await getDbConnection();

    // Start sync log
    const [syncLogResult] = await connection.execute(
      'INSERT INTO component_sync_logs (sync_started_at) VALUES (CURRENT_TIMESTAMP)'
    );
    const syncLogId = syncLogResult.insertId;

    let componentsAdded = 0;
    let componentsUpdated = 0;

    try {
      console.log('🔧 Debug: Making request to DataPacket API...');

      const requestHeaders = {
        'Authorization': `Bearer ${process.env.DATAPACKET_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // First, let's try to get individual component pricing if available
      // This query attempts to get more detailed pricing information
      const graphqlQuery = {
        query: `
          query GetComponentsWithDetailedPricing {
            # Try to get individual component prices if available
            components {
              cpus {
                id
                name
                cores
                threads
                price {
                  amount
                  currency
                }
                monthlyPrice {
                  amount
                  currency
                }
              }
              storage {
                id
                type
                size
                price {
                  amount
                  currency
                }
                monthlyPrice {
                  amount
                  currency
                }
              }
              memory {
                id
                size
                type
                price {
                  amount
                  currency
                }
                monthlyPrice {
                  amount
                  currency
                }
              }
            }
            
            # Fallback to configurations for availability and stock
            provisioningConfigurations(input: {}) {
              configurationId
              memory
              storage {
                size
                type
              }
              cpus {
                count
                name
                cores
                threads
              }
              uplink {
                ports {
                  capacity
                }
              }
              monthlyHwPrice {
                amount
                currency
              }
              dailyHwPrice {
                amount
                currency
              }
              location {
                name
                region
                short
                identifier
              }
              stockCount
            }
          }
        `,
        variables: {}
      };

      console.log('🔧 Debug: Trying detailed pricing query first...');

      // Try the detailed query first
      let apiData;
      let useDetailedPricing = false;

      try {
        const datapacketResponse = await fetch(process.env.DATAPACKET_API_URL, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(graphqlQuery)
        });

        if (datapacketResponse.ok) {
          apiData = await datapacketResponse.json();
          if (apiData.data?.components) {
            useDetailedPricing = true;
            console.log('✅ Detailed pricing data available');
          }
        }
      } catch (error) {
        console.log('⚠️ Detailed pricing query failed, falling back to configurations');
      }

      // If detailed pricing failed, use the original query
      if (!useDetailedPricing) {
        const fallbackQuery = {
          query: `
            query GetComponentsWithPricing($input: ProvisioningConfigurationsInput) {
              provisioningConfigurations(input: $input) {
                configurationId
                memory
                storage {
                  size
                  type
                }
                cpus {
                  count
                  name
                  cores
                  threads
                }
                uplink {
                  ports {
                    capacity
                }
                }
                monthlyHwPrice {
                  amount
                  currency
                }
                dailyHwPrice {
                  amount
                  currency
                }
                location {
                  name
                  region
                  short
                  identifier
                }
                stockCount
              }
            }
          `,
          variables: {
            input: {}
          }
        };

        const datapacketResponse = await fetch(process.env.DATAPACKET_API_URL, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(fallbackQuery)
        });

        if (!datapacketResponse.ok) {
          throw new Error(`DataPacket API error: ${datapacketResponse.status}`);
        }

        apiData = await datapacketResponse.json();
      }

      const responseData = apiData.data || apiData;

      // === COMPREHENSIVE API DEBUGGING ===
console.log('🔍 === FULL DATAPACKET API RESPONSE DEBUG ===');
console.log('Raw API Response Keys:', Object.keys(apiData));
console.log('Response Data Keys:', Object.keys(responseData));

// Log the complete raw response (be careful, this might be huge)
console.log('📦 Complete Raw API Response:', JSON.stringify(apiData, null, 2));

// Log detailed breakdown
if (responseData.components) {
  console.log('🧩 COMPONENTS SECTION:');
  console.log('Components Keys:', Object.keys(responseData.components));
  
  if (responseData.components.cpus) {
    console.log('💻 CPUs Sample (first 2):', JSON.stringify(responseData.components.cpus.slice(0, 2), null, 2));
    console.log('💻 Total CPUs count:', responseData.components.cpus.length);
  }
  
  if (responseData.components.storage) {
    console.log('💾 Storage Sample (first 2):', JSON.stringify(responseData.components.storage.slice(0, 2), null, 2));
    console.log('💾 Total Storage count:', responseData.components.storage.length);
  }
  
  if (responseData.components.memory) {
    console.log('🧠 Memory Sample (first 2):', JSON.stringify(responseData.components.memory.slice(0, 2), null, 2));
    console.log('🧠 Total Memory count:', responseData.components.memory.length);
  }
  
  if (responseData.components.operatingSystems) {
    console.log('🖥️ Operating Systems Sample (first 5):', JSON.stringify(responseData.components.operatingSystems.slice(0, 5), null, 2));
    console.log('🖥️ Total Operating Systems count:', responseData.components.operatingSystems.length);
  } else {
    console.log('🖥️ No operatingSystems found in components');
  }
}

if (responseData.provisioningConfigurations) {
  console.log('⚙️ PROVISIONING CONFIGURATIONS SECTION:');
  console.log('⚙️ Total Configurations:', responseData.provisioningConfigurations.length);
  
  // Sample of first few configurations
  const sampleConfigs = responseData.provisioningConfigurations.slice(0, 3);
  console.log('⚙️ Sample Configurations (first 3):');
  sampleConfigs.forEach((config, index) => {
    console.log(`Config ${index + 1}:`, JSON.stringify(config, null, 2));
  });
  
  // Check what OS data is in configurations
  const configsWithOS = responseData.provisioningConfigurations.filter(config => 
    config.operatingSystem || config.operatingSystems || config.os
  );
  console.log('🖥️ Configurations with OS data:', configsWithOS.length);
  if (configsWithOS.length > 0) {
    console.log('🖥️ Sample OS in configurations:', JSON.stringify(configsWithOS.slice(0, 2), null, 2));
  }
}

// Check for any other interesting fields
const otherKeys = Object.keys(responseData).filter(key => 
  !['components', 'provisioningConfigurations'].includes(key)
);
if (otherKeys.length > 0) {
  console.log('🔍 Other fields in response:', otherKeys);
  otherKeys.forEach(key => {
    console.log(`🔍 ${key}:`, responseData[key]);
  });
}

console.log('🔍 === END DATAPACKET API RESPONSE DEBUG ===');
// === END COMPREHENSIVE DEBUGGING ===

      // Process components based on which data we have
      const locations = new Map();
      const cpus = new Map();
      const rams = new Map();
      const storage = new Map();

      if (useDetailedPricing && responseData.components) {
        // Process components with individual pricing
        const components = responseData.components;

        // Process CPUs with pricing
        if (components.cpus) {
          for (const cpu of components.cpus) {
            const price = cpu.monthlyPrice?.amount || cpu.price?.amount || 0;
            cpus.set(cpu.id || cpu.name, {
              id: cpu.id || cpu.name,
              name: cpu.name,
              type: 'cpu',
              base_price: parseFloat(price),
              specs: {
                cores: cpu.cores,
                threads: cpu.threads
              }
            });
          }
        }

        // Process Storage with pricing
        if (components.storage) {
          for (const stor of components.storage) {
            const storageId = `${stor.type.toLowerCase()}-${stor.size}GB`;
            const price = stor.monthlyPrice?.amount || stor.price?.amount || 0;
            storage.set(storageId, {
              id: storageId,
              name: `${stor.size}GB ${stor.type.toUpperCase()}`,
              type: 'storage',
              base_price: parseFloat(price),
              specs: {
                size: stor.size,
                type: stor.type.toLowerCase(),
                storageType: stor.type.toLowerCase(),
                displayType: stor.type.toUpperCase()
              }
            });
          }
        }

        // Process Memory with pricing
        if (components.memory) {
          for (const mem of components.memory) {
            const ramId = `RAM-${mem.size}GB`;
            const price = mem.monthlyPrice?.amount || mem.price?.amount || 0;
            rams.set(ramId, {
              id: ramId,
              name: `${mem.size}GB RAM`,
              type: 'memory',
              base_price: parseFloat(price),
              specs: {
                size: mem.size,
                type: mem.type || 'DDR4' // Default if not provided
              }
            });
          }
        }
      }

      // Process configurations for stock and availability (and pricing if not available above)
      const configurations = responseData.provisioningConfigurations || [];
      console.log(`🔧 Debug: Processing ${configurations.length} configurations`);

      // Price calculation based on configuration breakdown
      // This is more accurate than the percentage approach
      const calculateComponentPriceFromConfig = (config, componentType) => {
        const monthlyPrice = parseFloat(config.monthlyHwPrice?.amount || 0);

        // Rough breakdown based on typical server component costs
        // These percentages can be adjusted based on your market
        const breakdown = {
          cpu: 0.35,      // CPUs typically 35% of server cost
          memory: 0.25,   // RAM typically 25% of server cost
          storage: 0.20,  // Storage typically 20% of server cost
          location: 0,    // Location doesn't have individual pricing
          other: 0.20     // Network, motherboard, PSU, etc.
        };

        // For storage, we need to consider the type
        if (componentType === 'storage' && config.storage) {
          const storageTypes = config.storage.map(s => s.type.toLowerCase());
          const hasNVMe = storageTypes.includes('nvme');
          const hasSSD = storageTypes.includes('ssd') || storageTypes.includes('sata_ssd');

          // NVMe is more expensive than SSD, which is more expensive than HDD
          if (hasNVMe) {
            return monthlyPrice * 0.25; // NVMe gets higher percentage
          } else if (hasSSD) {
            return monthlyPrice * 0.20; // SSD gets medium percentage
          } else {
            return monthlyPrice * 0.15; // HDD gets lower percentage
          }
        }

        return monthlyPrice * (breakdown[componentType] || 0);
      };

      // Process configurations to fill in missing components and get stock info
      for (const config of configurations) {
        // Extract location
        if (config.location) {
          const locId = config.location.short || config.location.identifier;
          if (!locations.has(locId)) {
            locations.set(locId, {
              id: locId,
              name: config.location.name,
              type: 'location',
              base_price: 0,
              specs: {
                region: config.location.region,
                short: config.location.short,
                identifier: config.location.identifier
              }
            });
          }
        }

        // Extract CPUs if not already from detailed pricing
        if (config.cpus && !useDetailedPricing) {
          for (const cpu of config.cpus) {
            const cpuId = cpu.name;
            if (!cpus.has(cpuId)) {
              cpus.set(cpuId, {
                id: cpuId,
                name: cpu.name,
                type: 'cpu',
                base_price: calculateComponentPriceFromConfig(config, 'cpu'),
                specs: {
                  count: cpu.count,
                  cores: cpu.cores,
                  threads: cpu.threads
                }
              });
            }
          }
        }

        // Extract Memory if not already from detailed pricing
        if (config.memory && !useDetailedPricing) {
          const ramId = `RAM-${config.memory}GB`;
          if (!rams.has(ramId)) {
            rams.set(ramId, {
              id: ramId,
              name: `${config.memory}GB RAM`,
              type: 'memory',
              base_price: calculateComponentPriceFromConfig(config, 'memory'),
              specs: {
                size: config.memory
              }
            });
          }
        }

        // Extract Storage if not already from detailed pricing
        if (config.storage && !useDetailedPricing) {
          for (const stor of config.storage) {
            const normalizedType = stor.type.toLowerCase();
            const storageId = `${normalizedType}-${stor.size}GB`;

            if (!storage.has(storageId)) {
              // Calculate storage price based on type
              let storagePrice = calculateComponentPriceFromConfig(config, 'storage');

              // Adjust price based on storage technology
              if (normalizedType.includes('nvme')) {
                storagePrice *= 1.5; // NVMe is ~50% more expensive
              } else if (normalizedType.includes('ssd') || normalizedType.includes('sata_ssd')) {
                storagePrice *= 1.2; // SSD is ~20% more expensive than base
              }
              // HDD uses base price

              storage.set(storageId, {
                id: storageId,
                name: `${stor.size}GB ${stor.type.toUpperCase()}`,
                type: 'storage',
                base_price: storagePrice,
                specs: {
                  size: stor.size,
                  type: normalizedType,
                  storageType: normalizedType,
                  displayType: stor.type.toUpperCase()
                }
              });
            }
          }
        }
      }

      // Get stock counts for all components
      const getComponentStockCount = (configurations, componentType, componentKey) => {
        return configurations
          .filter(config => config.stockCount > 0)
          .filter(config => {
            switch (componentType) {
              case 'cpu':
                return config.cpus?.some(cpu => cpu.name === componentKey);
              case 'memory':
                return config.memory === parseInt(componentKey.replace('RAM-', '').replace('GB', ''));
              case 'storage':
                return config.storage?.some(s => {
                  const normalizedType = s.type.toLowerCase();
                  return `${normalizedType}-${s.size}GB` === componentKey;
                });
              case 'location':
                return config.location?.short === componentKey;
              default:
                return false;
            }
          })
          .reduce((total, config) => total + config.stockCount, 0);
      };

      // Update all components with stock information
      for (const [id, component] of [...cpus, ...rams, ...storage, ...locations]) {
        const stockCount = getComponentStockCount(configurations, component.type, id);
        component.stockCount = stockCount;
        component.available = stockCount > 0;
        component.specs.stockCount = stockCount;
        component.specs.isInStock = stockCount > 0;
      }

      // Process all components
      const allComponents = [
        ...locations.values(),
        ...cpus.values(),
        ...rams.values(),
        ...storage.values()
      ];

      console.log(`🔧 Debug: Total unique components extracted: ${allComponents.length}`);
      console.log(`🔧 Debug: Pricing method used: ${useDetailedPricing ? 'Detailed API' : 'Configuration-based estimation'}`);

      // Insert/update components in database
      for (const component of allComponents) {
        const stockCount = component.stockCount || 0;
        const isInStock = stockCount > 0;

        const fullDatapacketData = {
          ...component,
          available: isInStock,
          stockCount: stockCount,
          inStock: isInStock
        };

        const updatedSpecs = {
          ...component.specs,
          stockCount: stockCount,
          isInStock: isInStock
        };

        const finalComponentData = {
          ...component,
          specs: JSON.stringify(updatedSpecs),
          datapacket_data: JSON.stringify(fullDatapacketData),
          datapacket_updated_at: new Date()
        };

        console.log(`🔧 Debug: Processing ${finalComponentData.type}:`, finalComponentData.id,
          `Price: $${finalComponentData.base_price.toFixed(2)}`, `Stock: ${stockCount}`);

        // Check if component exists
        const [existing] = await connection.execute(
          'SELECT id, datapacket_data, custom_price, custom_name FROM components WHERE id = ?',
          [finalComponentData.id]
        );

        if (existing.length === 0) {
          // New component - add as disabled by default
          await connection.execute(
            `INSERT INTO components 
             (id, name, type, base_price, specs, datapacket_data, is_enabled, datapacket_updated_at, first_seen_at) 
             VALUES (?, ?, ?, ?, ?, ?, FALSE, ?, CURRENT_TIMESTAMP)`,
            [
              finalComponentData.id,
              finalComponentData.name,
              finalComponentData.type,
              finalComponentData.base_price,
              finalComponentData.specs,
              finalComponentData.datapacket_data,
              finalComponentData.datapacket_updated_at
            ]
          );
          componentsAdded++;
        } else {
          // Update existing component but preserve custom admin settings
          const hasCustomPrice = existing[0].custom_price !== null;
          const hasCustomName = existing[0].custom_name !== null;

          if (hasCustomPrice && hasCustomName) {
            // Don't update name or price, just sync specs and datapacket_data
            await connection.execute(
              `UPDATE components 
               SET specs = ?, datapacket_data = ?, 
                   datapacket_updated_at = ?, last_updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [
                finalComponentData.specs,
                finalComponentData.datapacket_data,
                finalComponentData.datapacket_updated_at,
                finalComponentData.id
              ]
            );
          } else if (hasCustomPrice) {
            // Update name but keep custom price
            await connection.execute(
              `UPDATE components 
               SET name = ?, specs = ?, datapacket_data = ?, 
                   datapacket_updated_at = ?, last_updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [
                finalComponentData.name,
                finalComponentData.specs,
                finalComponentData.datapacket_data,
                finalComponentData.datapacket_updated_at,
                finalComponentData.id
              ]
            );
          } else if (hasCustomName) {
            // Update price but keep custom name
            await connection.execute(
              `UPDATE components 
               SET base_price = ?, specs = ?, datapacket_data = ?, 
                   datapacket_updated_at = ?, last_updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [
                finalComponentData.base_price,
                finalComponentData.specs,
                finalComponentData.datapacket_data,
                finalComponentData.datapacket_updated_at,
                finalComponentData.id
              ]
            );
          } else {
            // Update everything (no custom overrides)
            await connection.execute(
              `UPDATE components 
               SET name = ?, base_price = ?, specs = ?, datapacket_data = ?, 
                   datapacket_updated_at = ?, last_updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [
                finalComponentData.name,
                finalComponentData.base_price,
                finalComponentData.specs,
                finalComponentData.datapacket_data,
                finalComponentData.datapacket_updated_at,
                finalComponentData.id
              ]
            );
          }
          componentsUpdated++;
        }
      }

// Sync Operating Systems from DataPacket API
try {
  const osResults = await syncOperatingSystemsFromAPI(connection, requestHeaders);
  componentsAdded += osResults.osAdded;
  componentsUpdated += osResults.osUpdated;
} catch (error) {
  console.error('Error syncing operating systems from API:', error);
}

      // Complete sync log
      await connection.execute(
        `UPDATE component_sync_logs 
         SET sync_completed_at = CURRENT_TIMESTAMP, 
             components_added = ?, 
             components_updated = ?, 
             sync_status = 'completed'
         WHERE id = ?`,
        [componentsAdded, componentsUpdated, syncLogId]
      );

      console.log(`🔧 Debug: Sync completed - Added: ${componentsAdded}, Updated: ${componentsUpdated}`);

    } catch (error) {
      console.log('🔧 Debug: Error in sync process:', error.message);

      // Mark sync as failed
      await connection.execute(
        `UPDATE component_sync_logs 
         SET sync_status = 'failed', error_message = ? 
         WHERE id = ?`,
        [error.message, syncLogId]
      );
      throw error;
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      componentsAdded,
      componentsUpdated
    });

  } catch (error) {
    console.error('Error syncing components:', error);
    return NextResponse.json(
      { error: 'Failed to sync components', details: error.message },
      { status: 500 }
    );
  }
}