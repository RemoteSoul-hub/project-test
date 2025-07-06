/**
Maps component selections to DataPacket configuration requirements
 */
export function mapSelectionsToDataPacketFilters(selectedComponents, components) {
  const filters = {};
  
  // Map CPU selection
  if (selectedComponents.cpu) {
    const cpuComponent = components.cpu?.find(c => c.id === selectedComponents.cpu);
    if (cpuComponent?.specs) {
      try {
        const specs = JSON.parse(cpuComponent.specs);
        if (specs.cores) {
          filters.cpuCores = { min: specs.cores, max: specs.cores };
        }
        if (specs.name) {
          filters.cpuName_in = [specs.name];
        }
      } catch (e) {
        console.warn('Failed to parse CPU specs:', e);
      }
    }
  }

  // Map Memory selection
  if (selectedComponents.memory) {
    const memoryComponent = components.memory?.find(c => c.id === selectedComponents.memory);
    if (memoryComponent?.specs) {
      try {
        const specs = JSON.parse(memoryComponent.specs);
        if (specs.size) {
          filters.memory = { min: specs.size, max: specs.size };
        }
      } catch (e) {
        console.warn('Failed to parse memory specs:', e);
      }
    }
  }

  // Map Storage selection
  if (selectedComponents.storage) {
    const storageComponent = components.storage?.find(c => c.id === selectedComponents.storage);
    if (storageComponent?.specs) {
      try {
        const specs = JSON.parse(storageComponent.specs);
        const storageRequirement = {};
        
        if (specs.type) {
          // Map storage types to DataPacket enum values
          const typeMap = {
            'ssd': '',
            'sata_ssd': 'SATA',
            'nvme': 'NVME',
            'hdd': 'HDD'
          };
          const mappedType = typeMap[specs.type.toLowerCase()] || 'SATA_SSD';
          storageRequirement.type_in = [mappedType];
        }
        
        if (specs.size) {
          storageRequirement.totalSize = { min: specs.size };
        }
        
        if (Object.keys(storageRequirement).length > 0) {
          filters.storageRequirements = [storageRequirement];
        }
      } catch (e) {
        console.warn('Failed to parse storage specs:', e);
      }
    }
  }

  // Map Location selection
  if (selectedComponents.location) {
    const locationComponent = components.location?.find(c => c.id === selectedComponents.location);
    if (locationComponent?.specs) {
      try {
        const specs = JSON.parse(locationComponent.specs);
        if (specs.identifier) {
          filters.locationIdentifier_in = [specs.identifier];
        } else if (specs.region) {
          filters.region_in = [specs.region];
        }
      } catch (e) {
        console.warn('Failed to parse location specs:', e);
      }
    }
  }

  return filters;
}

/**
 * Finds a matching DataPacket configuration ID based on component selections
 */
export async function findMatchingConfiguration(selectedComponents, components) {
  try {
    // Build filters from selections
    const filters = mapSelectionsToDataPacketFilters(selectedComponents, components);
    
    // Query DataPacket API for matching configurations
    const response = await fetch('/api/datapacket/configurations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filters })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch configurations: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the first matching configuration (or implement more sophisticated matching)
    return data.configurations?.[0]?.configurationId || null;
  } catch (error) {
    console.error('Error finding matching configuration:', error);
    return null;
  }
}

/**
 * Maps OS selection to DataPacket OS image ID
 */
export function mapOSToImageId(selectedOS, operatingSystems) {
  if (!selectedOS || !operatingSystems?.length) {
    return operatingSystems?.[0]?.osImageId || null;
  }

  // Try to find exact match first
  const exactMatch = operatingSystems.find(os => 
    os.osImageId === selectedOS || 
    os.name.toLowerCase().includes(selectedOS.toLowerCase())
  );

  if (exactMatch) {
    return exactMatch.osImageId;
  }

  // Fallback to first available OS
  return operatingSystems[0]?.osImageId || null;
}

/**
 * Validates that all required components are selected
 */
export function validateConfiguration(selectedComponents) {
  const required = ['cpu', 'memory', 'storage', 'location'];
  const missing = required.filter(component => !selectedComponents[component]);
  
  return {
    isValid: missing.length === 0,
    missing,
    message: missing.length > 0 ? `Missing required components: ${missing.join(', ')}` : 'Configuration is valid'
  };
}

/**
 * Calculates estimated pricing based on component selections
 */
export function calculateEstimatedPricing(selectedComponents, components, currency = 'USD') {
  let totalPrice = 0;
  const breakdown = {};

  // Calculate base prices from selected components
  Object.entries(selectedComponents).forEach(([type, componentId]) => {
    if (componentId && components[type]) {
      const component = components[type].find(c => c.id === componentId);
      if (component?.base_price) {
        breakdown[type] = component.base_price;
        totalPrice += component.base_price;
      }
    }
  });

  // Apply currency conversion if needed
  const currencyRates = {
    'USD': 1,
    'EUR': 0.85,
    'GBP': 0.73
  };

  const rate = currencyRates[currency] || 1;
  const convertedTotal = totalPrice * rate;

  return {
    total: convertedTotal,
    breakdown,
    currency,
    baseTotal: totalPrice
  };
}

/**
 * Formats server configuration for display
 */
export function formatConfigurationSummary(selectedComponents, components) {
  const summary = {};

  Object.entries(selectedComponents).forEach(([type, componentId]) => {
    if (componentId && components[type]) {
      const component = components[type].find(c => c.id === componentId);
      if (component) {
        summary[type] = {
          name: component.name,
          specs: component.specs ? JSON.parse(component.specs) : {},
          price: component.base_price
        };
      }
    }
  });

  return summary;
}

/**
 * Generates SSH key names for server provisioning
 * This would typically come from user's saved SSH keys
 */
export function getDefaultSSHKeys() {
  // In a real implementation, this would fetch from user's profile
  // For now, return empty array (user can provision without SSH keys)
  return [];
}

/**
 * Handles server provisioning with error handling and retry logic
 */
export async function provisionServerWithRetry(provisioningData, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(provisioningData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Provisioning failed');
      }

      return result.server;
    } catch (error) {
      lastError = error;
      console.warn(`Provisioning attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Creates a provisioning request object
 */
export function createProvisioningRequest(selectedComponents, components, selectedOS, billingPeriod = 'MONTHLY') {
  const validation = validateConfiguration(selectedComponents);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  return {
    selectedComponents,
    components,
    selectedOS,
    billingPeriod,
    sshKeyNames: getDefaultSSHKeys(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Monitors server provisioning status
 */
export async function monitorProvisioningStatus(serverName, onStatusUpdate, maxWaitTime = 600000) { // 10 minutes
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds
  
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        if (Date.now() - startTime > maxWaitTime) {
          reject(new Error('Provisioning timeout'));
          return;
        }

        const response = await fetch(`/api/servers/${serverName}/status`);
        if (!response.ok) {
          throw new Error(`Failed to check status: ${response.status}`);
        }

        const { status, server } = await response.json();
        
        if (onStatusUpdate) {
          onStatusUpdate(status, server);
        }

        if (status === 'ACTIVE') {
          resolve(server);
        } else if (status === 'FAILED') {
          reject(new Error('Server provisioning failed'));
        } else {
          // Continue polling
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

/**
 * Utility for caching DataPacket API responses
 */
export class DataPacketCache {
  constructor(ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// Global cache instance
export const dataPacketCache = new DataPacketCache();

/**
 * Error handling utilities for DataPacket API
 */
export class DataPacketError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'DataPacketError';
    this.code = code;
    this.details = details;
  }
}

export function handleDataPacketError(error, context = '') {
  console.error(`DataPacket API Error ${context}:`, error);
  
  if (error instanceof DataPacketError) {
    return error;
  }
  
  // Map common HTTP errors
  if (error.message.includes('401')) {
    return new DataPacketError('Authentication failed. Please check your API key.', 'AUTH_ERROR');
  }
  
  if (error.message.includes('403')) {
    return new DataPacketError('Access forbidden. Insufficient permissions.', 'PERMISSION_ERROR');
  }
  
  if (error.message.includes('429')) {
    return new DataPacketError('Rate limit exceeded. Please try again later.', 'RATE_LIMIT_ERROR');
  }
  
  if (error.message.includes('500')) {
    return new DataPacketError('DataPacket service temporarily unavailable.', 'SERVICE_ERROR');
  }
  
  return new DataPacketError(error.message || 'Unknown error occurred', 'UNKNOWN_ERROR');
}