// ===== LOGGING CONFIGURATION =====
const LOGGING_CONFIG = {
  enabled: process.env.DATAPACKET_DEBUG === 'true' || process.env.NODE_ENV === 'development',
  levels: {
    api: process.env.DATAPACKET_LOG_API !== 'false', 
    transform: process.env.DATAPACKET_LOG_TRANSFORM !== 'false', 
    route: process.env.DATAPACKET_LOG_ROUTE !== 'false', 
    detailed: process.env.DATAPACKET_LOG_DETAILED === 'true', 
    errors: true 
  }
};

// Configurable logger
const logger = {
  api: (message, data = null) => {
    if (LOGGING_CONFIG.enabled && LOGGING_CONFIG.levels.api) {
      console.log(`📡 [DATAPACKET API] ${message}`, data ? (LOGGING_CONFIG.levels.detailed ? JSON.stringify(data, null, 2) : data) : '');
    }
  },
  transform: (message, data = null) => {
    if (LOGGING_CONFIG.enabled && LOGGING_CONFIG.levels.transform) {
      console.log(`🔄 [TRANSFORM] ${message}`, data ? (LOGGING_CONFIG.levels.detailed ? JSON.stringify(data, null, 2) : data) : '');
    }
  },
  route: (message, data = null) => {
    if (LOGGING_CONFIG.enabled && LOGGING_CONFIG.levels.route) {
      console.log(`🎯 [API ROUTE] ${message}`, data ? (LOGGING_CONFIG.levels.detailed ? JSON.stringify(data, null, 2) : data) : '');
    }
  },
  error: (message, error = null) => {
    if (LOGGING_CONFIG.enabled && LOGGING_CONFIG.levels.errors) {
      console.error(`❌ ${message}`, error || '');
    }
  },
  success: (message, data = null) => {
    if (LOGGING_CONFIG.enabled) {
      console.log(`✅ ${message}`, data ? (LOGGING_CONFIG.levels.detailed ? JSON.stringify(data, null, 2) : data) : '');
    }
  }
};

const DATAPACKET_API_URL = 'https://api.datapacket.com/v0/beta/graphql';

// City to country code mapping
const CITY_TO_COUNTRY = {
  // Europe
  'Manchester': 'UK',
  'London': 'UK',
  'Paris': 'FR',
  'Amsterdam': 'NL',
  'Frankfurt': 'DE',
  'Athens': 'GR',
  'Bratislava': 'SK',
  'Brussels': 'BE',
  'Bucharest': 'RO',
  'Budapest': 'HU',
  'Copenhagen': 'DK',
  'Dublin': 'IE',
  'Kyiv': 'UA',
  'Lisbon': 'PT',
  'Madrid': 'ES',
  'Marseille': 'FR',
  'Milan': 'IT',
  'Oslo': 'NO',
  'Palermo': 'IT',
  'Prague': 'CZ',
  'Sofia': 'BG',
  'Stockholm': 'SE',
  'Vienna': 'AT',
  'Warsaw': 'PL',
  'Zagreb': 'HR',

  // North America
  'Toronto': 'CA',
  'Chicago': 'US',
  'Washington DC': 'US',
  'Washington': 'US',
  'New York': 'US',
  'Los Angeles': 'US',
  'Miami': 'US',
  'Ashburn': 'US',
  'Atlanta': 'US',
  'Boston': 'US',
  'Dallas': 'US',
  'Denver': 'US',
  'Houston': 'US',
  'McAllen': 'US',
  'Seattle': 'US',
  'Vancouver': 'CA',
  'Montréal': 'CA',
  'Montreal': 'CA',

  // Latin America
  'São Paulo': 'BR',
  'Sao Paulo': 'BR',
  'Querétaro': 'MX',
  'Queretaro': 'MX',
  'Buenos Aires': 'AR',
  'Bogotá': 'CO',
  'Bogota': 'CO',
  'Lima': 'PE',
  'Santiago': 'CL',

  // Asia Pacific
  'Mumbai': 'IN',
  'Singapore': 'SG',
  'Hong Kong': 'HK',
  'Seoul': 'KR',
  'Tokyo': 'JP',
  'Sydney': 'AU',
  'Melbourne': 'AU',
  'Auckland': 'NZ',

  // Middle East & Africa
  'Tel Aviv': 'IL',
  'Dubai': 'AE',
  'Johannesburg': 'ZA',
  'Lagos': 'NG'
};

const PREFERRED_CITIES = Object.keys(CITY_TO_COUNTRY);

// GraphQL queries
const PROVISIONING_CONFIGURATIONS_QUERY = `
  query ProvisioningConfigurations($input: ProvisioningConfigurationsInput) {
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
      gpus {
        name
        memory
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
`;

// Alternative query to try if the main one fails - with frequency field
const PROVISIONING_CONFIGURATIONS_WITH_FREQUENCY_QUERY = `
  query ProvisioningConfigurations($input: ProvisioningConfigurationsInput) {
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
        frequency
      }
      gpus {
        name
        memory
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
`;

const LOCATIONS_QUERY = `
  query Locations {
    locations {
      name
      region
      short
      identifier
    }
  }
`;

const OPERATING_SYSTEMS_QUERY = `
  query OperatingSystems {
    operatingSystems {
      osImageId
      name
    }
  }
`;

async function fetchDataPacketAPI(query, variables = {}, retryWithoutFrequency = true) {
  const queryType = query.split('\n')[1]?.trim() || 'Unknown Query';

  logger.api('Making request:', {
    url: DATAPACKET_API_URL,
    query: queryType,
    variables: variables
  });

  const response = await fetch(DATAPACKET_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DATAPACKET_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      variables
    }),
  });

  logger.api(`Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    logger.error(`HTTP Error: ${response.status} ${response.statusText}`);

    // If it's a 400 error and we haven't tried without frequency yet, retry
    if (response.status === 400 && retryWithoutFrequency && query.includes('frequency')) {
      logger.api('Retrying without frequency field...');
      return fetchDataPacketAPI(PROVISIONING_CONFIGURATIONS_QUERY, variables, false);
    }

    throw new Error(`DataPacket API error: ${response.status}`);
  }

  const data = await response.json();

  if (LOGGING_CONFIG.levels.detailed) {
    logger.api('Raw response data:', data);
  } else {
    logger.api(`Response received with ${Object.keys(data.data || {}).length} top-level fields`);
  }

  if (data.errors) {
    logger.error('GraphQL Errors:', data.errors);

    // If there are GraphQL errors and we haven't tried without frequency yet, retry
    if (retryWithoutFrequency && query.includes('frequency')) {
      logger.api('Retrying without frequency field due to GraphQL errors...');
      return fetchDataPacketAPI(PROVISIONING_CONFIGURATIONS_QUERY, variables, false);
    }

    throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
  }

  logger.success('Successfully fetched data');
  return data.data;
}

// Transform DataPacket data to match your component's expected structure
function transformConfigurations(configurations, operatingSystems, locations) {
  logger.transform('Starting transformation with:', {
    configurationsCount: configurations.length,
    operatingSystemsCount: operatingSystems.length,
    locationsCount: locations.length
  });

  // Log sample configuration for inspection (only in detailed mode)
  if (configurations.length > 0 && LOGGING_CONFIG.levels.detailed) {
    logger.transform('Sample configuration:', configurations[0]);
  }

  const groupedComponents = {
    cpu: [],
    memory: [],
    storage: [],
    location: [],
    gpu: [] // Add GPU category
  };

  // Create a Set to avoid duplicates
  const addedCPUs = new Set();
  const addedMemory = new Set();
  const addedStorage = new Set();
  const addedLocations = new Set();
  const addedGPUs = new Set();

  configurations.forEach((config, index) => {
    if (LOGGING_CONFIG.levels.detailed) {
      logger.transform(`Processing config ${index + 1}/${configurations.length}:`, {
        configurationId: config.configurationId,
        location: config.location.name,
        memory: config.memory,
        cpuCount: config.cpus.length,
        gpuCount: config.gpus.length,
        storageCount: config.storage.length,
        stockCount: config.stockCount,
        monthlyPrice: config.monthlyHwPrice
      });
    }

    const basePrice = parseFloat(config.monthlyHwPrice.amount);

    // Process CPUs
    config.cpus.forEach((cpu, cpuIndex) => {
      if (LOGGING_CONFIG.levels.detailed) {
        logger.transform(`CPU ${cpuIndex + 1}:`, cpu);
      }

      // Extract frequency from CPU name since API might not have frequency field
      const extractFrequencyFromName = (name) => {
        const frequencyMatch = name.match(/(\d+\.?\d*)\s*GHz/i);
        return frequencyMatch ? parseFloat(frequencyMatch[1]) : null;
      };

      // Try to get frequency from API field first, then extract from name
      const apiFrequency = cpu.frequency;
      const nameFrequency = extractFrequencyFromName(cpu.name);
      const baseFrequency = apiFrequency || nameFrequency;

      if (baseFrequency) {
        logger.transform(`CPU ${cpuIndex + 1} Frequency: ${baseFrequency} GHz (source: ${apiFrequency ? 'API field' : 'extracted from name'})`);
      }

      // Use the actual frequency with fallbacks
      const baseClock = baseFrequency ? `${baseFrequency}GHz` : '2.0GHz';
      const boostClock = baseFrequency ? `${(baseFrequency + 0.5).toFixed(1)}GHz` : '3.0GHz';

      const cpuKey = `${cpu.name}-${cpu.cores}-${cpu.threads}`;
      if (!addedCPUs.has(cpuKey)) {
        addedCPUs.add(cpuKey);
        groupedComponents.cpu.push({
          id: `cpu-${groupedComponents.cpu.length + 1}`,
          name: cpu.name,
          type: 'cpu',
          base_price: basePrice,
          available: config.stockCount > 0,
          specs: JSON.stringify({
            cores: cpu.cores,
            threads: cpu.threads,
            base_clock: baseClock,
            boost_clock: boostClock,
            frequency: baseFrequency, // Store the numeric frequency value
            count: cpu.count
          })
        });
      }
    });

    // Process GPUs (if any)
    if (config.gpus && config.gpus.length > 0) {
      config.gpus.forEach((gpu, gpuIndex) => {
        if (LOGGING_CONFIG.levels.detailed) {
          logger.transform(`GPU ${gpuIndex + 1}:`, gpu);
        }

        // Add GPU to components if we want to track them separately
        const gpuKey = `${gpu.name}-${gpu.memory}`;
        if (!addedGPUs.has(gpuKey)) {
          addedGPUs.add(gpuKey);
          groupedComponents.gpu.push({
            id: `gpu-${groupedComponents.gpu.length + 1}`,
            name: gpu.name,
            type: 'gpu',
            base_price: basePrice,
            available: config.stockCount > 0,
            specs: JSON.stringify({
              memory: gpu.memory
            })
          });
        }
      });
    }

    // Process Memory
    const memoryKey = config.memory;
    if (!addedMemory.has(memoryKey)) {
      if (LOGGING_CONFIG.levels.detailed) {
        logger.transform(`Memory: ${config.memory}GB`);
      }
      addedMemory.add(memoryKey);
      groupedComponents.memory.push({
        id: `memory-${groupedComponents.memory.length + 1}`,
        name: `${config.memory}GB RAM`,
        type: 'memory',
        base_price: basePrice,
        available: config.stockCount > 0,
        specs: JSON.stringify({
          size: config.memory,
          type: 'DDR4', // Default since not specified
          speed: '3200MHz' // Default since not specified
        })
      });
    }

    // Process Storage
    config.storage.forEach((storage, storageIndex) => {
      if (LOGGING_CONFIG.levels.detailed) {
        logger.transform(`Storage ${storageIndex + 1}:`, storage);
      }

      // Normalize storage type - simplified to SSD vs HDD
      const originalType = storage.type.toLowerCase();
      let normalizedType;

      if (originalType.includes('hdd')) {
        normalizedType = 'hdd';
      } else {
        // Everything else (SSD, SATA SSD, NVMe) becomes 'ssd'
        normalizedType = 'ssd';
      }

      const storageKey = `${storage.size}-${normalizedType}`;
      if (!addedStorage.has(storageKey)) {
        addedStorage.add(storageKey);
        groupedComponents.storage.push({
          id: `${normalizedType}-${storage.size}GB`, // Use normalized type in ID
          name: `${storage.size}GB ${storage.type}`, // Keep original type in display name
          type: 'storage',
          base_price: basePrice,
          available: config.stockCount > 0,
          specs: JSON.stringify({
            size: storage.size,
            type: normalizedType, // Simplified type (ssd or hdd)
            storageType: normalizedType, // Explicit storage type field
            originalType: storage.type, // Keep original API type
            displayType: storage.type.toUpperCase(), // For display
            interface: storage.type === 'NVME' ? 'NVMe' : 'SATA',
            stockCount: config.stockCount,
            isInStock: config.stockCount > 0
          })
        });
      }
    });

    // Process Location
    const locationKey = config.location.identifier;
    const cityName = config.location.name;

    if (!addedLocations.has(locationKey)) {
      if (LOGGING_CONFIG.levels.detailed) {
        logger.transform('Location:', config.location);
      }
      addedLocations.add(locationKey);

      // Get country from mapping, fallback to API data
      const countryCode = CITY_TO_COUNTRY[cityName] ||
        config.location.short ||
        config.location.region;

      // Check if this is a preferred location
      const isPreferred = PREFERRED_CITIES.includes(cityName);

      groupedComponents.location.push({
        id: `location-${groupedComponents.location.length + 1}`,
        name: `${cityName}, ${countryCode}`,
        type: 'location',
        base_price: 0,
        available: config.stockCount > 0,
        isPreferred: isPreferred, // Flag for admin controls
        adminVisible: true, // Admin can toggle this
        specs: JSON.stringify({
          city: config.location.name,
          region: config.location.region,
          short: config.location.short,
          identifier: config.location.identifier,
          countryCode: countryCode,
          isPreferred: isPreferred
        })
      });
    }
  });

  logger.transform('Transformation complete. Summary:', {
    totalCPUs: groupedComponents.cpu.length,
    totalGPUs: groupedComponents.gpu.length,
    totalMemory: groupedComponents.memory.length,
    totalStorage: groupedComponents.storage.length,
    totalLocations: groupedComponents.location.length
  });

  if (LOGGING_CONFIG.levels.detailed) {
    logger.transform('Final grouped components:', groupedComponents);
  }

  return groupedComponents;
}

export async function GET(request) {
  try {
    logger.route('GET request received');

    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const minCores = searchParams.get('minCores');
    const maxPrice = searchParams.get('maxPrice');

    logger.route('Query parameters:', {
      region,
      minCores,
      maxPrice
    });

    // Build filters based on query parameters
    const filters = {};

    if (region) {
      filters.region_in = [region];
    }

    if (minCores) {
      filters.cpuCores = { min: parseInt(minCores) };
    }

    if (maxPrice) {
      filters.monthlyHwPriceAmount = { max: maxPrice };
    }

    logger.route('Applied filters:', filters);

    // Fetch data from DataPacket API
    logger.route('Starting parallel API calls...');
    const [configurationsData, locationsData, osData] = await Promise.all([
      // Try with frequency field first, fallback to basic query if it fails
      fetchDataPacketAPI(PROVISIONING_CONFIGURATIONS_WITH_FREQUENCY_QUERY, { input: filters }).catch(() =>
        fetchDataPacketAPI(PROVISIONING_CONFIGURATIONS_QUERY, { input: filters })
      ),
      fetchDataPacketAPI(LOCATIONS_QUERY),
      fetchDataPacketAPI(OPERATING_SYSTEMS_QUERY)
    ]);

    logger.route('All API calls completed. Raw data summary:', {
      configurations: {
        count: configurationsData.provisioningConfigurations?.length || 0,
        sample: LOGGING_CONFIG.levels.detailed ? configurationsData.provisioningConfigurations?.[0] : 'Enable detailed logging to see sample'
      },
      locations: {
        count: locationsData.locations?.length || 0,
        list: LOGGING_CONFIG.levels.detailed ? locationsData.locations?.map(l => l.name) : `${locationsData.locations?.length || 0} locations`
      },
      operatingSystems: {
        count: osData.operatingSystems?.length || 0,
        list: LOGGING_CONFIG.levels.detailed ? osData.operatingSystems?.map(os => os.name) : `${osData.operatingSystems?.length || 0} operating systems`
      }
    });

    // Transform the data to match your component's expected structure
    const groupedComponents = transformConfigurations(
      configurationsData.provisioningConfigurations,
      osData.operatingSystems,
      locationsData.locations
    );

    // Add operating systems as a separate section
    groupedComponents.operatingSystems = osData.operatingSystems.map((os, index) => ({
      id: `os-${index + 1}`,
      osImageId: os.osImageId,
      name: os.name,
      type: 'operating_system',
      available: true
    }));

    if (LOGGING_CONFIG.levels.detailed) {
      logger.route('Final response data:', groupedComponents);
    } else {
      logger.route('Response prepared with component counts:', {
        cpu: groupedComponents.cpu.length,
        memory: groupedComponents.memory.length,
        storage: groupedComponents.storage.length,
        location: groupedComponents.location.length,
        operatingSystems: groupedComponents.operatingSystems.length
      });
    }

    return new Response(JSON.stringify(groupedComponents), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600' // Cache for 5 minutes
      },
    });
  } catch (error) {
    logger.error('[API COMPONENTS ERROR - DATAPACKET]', {
      message: error.message,
      stack: LOGGING_CONFIG.levels.detailed ? error.stack : 'Enable detailed logging to see stack trace',
      name: error.name
    });

    // Return fallback static data if DataPacket API fails
    const { staticComponents } = await import('../../../data/staticComponents');
    const groupedComponents = staticComponents.reduce((acc, component) => {
      if (!acc[component.type]) {
        acc[component.type] = [];
      }
      acc[component.type].push(component);
      return acc;
    }, {});

    logger.route('Using fallback static data with component counts:', {
      total: Object.keys(groupedComponents).reduce((sum, key) => sum + groupedComponents[key].length, 0)
    });

    return new Response(JSON.stringify(groupedComponents), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Fallback': 'true' // Indicate this is fallback data
      },
    });
  }
}

// Optional: Add a POST endpoint for server provisioning
export async function POST(request) {
  try {
    logger.route('POST request for server provisioning');

    const requestBody = await request.json();
    logger.route('Request body:', LOGGING_CONFIG.levels.detailed ? requestBody : 'Enable detailed logging to see request body');

    const { configurationId, billingPeriod, osImageId, sshKeyNames } = requestBody;

    const PROVISION_SERVER_MUTATION = `
      mutation ProvisionServer($input: ProvisionServerInput!) {
        provisionServer(input: $input) {
          server {
            name
            statusV2
            network {
              ipAddresses {
                isPrimary
                ip
                cidr
                type
              }
              ipmi {
                ip
                username
              }
            }
            location {
              name
              region
            }
            hardware {
              cpus {
                name
                cores
                threads
              }
              storage {
                size
                type
              }
            }
          }
        }
      }
    `;

    const variables = {
      input: {
        configurationId,
        billingPeriod,
        osImageId,
        sshKeyNames: sshKeyNames || []
      }
    };

    logger.route('Provisioning variables:', LOGGING_CONFIG.levels.detailed ? variables : 'Enable detailed logging to see variables');

    const data = await fetchDataPacketAPI(PROVISION_SERVER_MUTATION, variables);

    logger.success('Server provisioned successfully:', LOGGING_CONFIG.levels.detailed ? data : 'Enable detailed logging to see server details');

    return new Response(JSON.stringify({
      success: true,
      server: data.provisionServer.server
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('[SERVER PROVISION ERROR]', {
      message: error.message,
      stack: LOGGING_CONFIG.levels.detailed ? error.stack : 'Enable detailed logging to see stack trace',
      name: error.name
    });

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}