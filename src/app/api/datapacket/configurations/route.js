const DATAPACKET_API_URL = 'https://api.datapacket.com/v0/beta/graphql';

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

async function fetchDataPacketAPI(query, variables = {}) {
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

  if (!response.ok) {
    throw new Error(`DataPacket API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
  }

  return data.data;
}

export async function POST(request) {
  try {
    const { filters } = await request.json();

    // Fetch matching configurations from DataPacket
    const data = await fetchDataPacketAPI(PROVISIONING_CONFIGURATIONS_QUERY, {
      input: filters
    });

    // Sort by price (lowest first) and availability
    const sortedConfigurations = data.provisioningConfigurations
      .filter(config => config.stockCount > 0) // Only available configurations
      .sort((a, b) => {
        // Primary sort: by stock availability
        if (a.stockCount !== b.stockCount) {
          return b.stockCount - a.stockCount;
        }
        // Secondary sort: by price
        return parseFloat(a.monthlyHwPrice.amount) - parseFloat(b.monthlyHwPrice.amount);
      });

    return new Response(JSON.stringify({
      success: true,
      configurations: sortedConfigurations,
      total: sortedConfigurations.length
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120' // Cache for 1 minute
      },
    });

  } catch (error) {
    console.error('[DATAPACKET CONFIGURATIONS ERROR]', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      configurations: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// GET endpoint for checking configuration availability
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const configurationId = searchParams.get('configurationId');

    if (configurationId) {
      // Check specific configuration availability
      const filters = { configurationId };
      const data = await fetchDataPacketAPI(PROVISIONING_CONFIGURATIONS_QUERY, {
        input: filters
      });

      const configuration = data.provisioningConfigurations[0];
      
      return new Response(JSON.stringify({
        success: true,
        available: configuration?.stockCount > 0,
        configuration: configuration || null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return basic availability info
    const data = await fetchDataPacketAPI(PROVISIONING_CONFIGURATIONS_QUERY, {
      input: { stockCount: { min: 1 } } // Only available configurations
    });

    const availableCount = data.provisioningConfigurations.length;
    const regions = [...new Set(data.provisioningConfigurations.map(c => c.location.region))];
    const priceRange = data.provisioningConfigurations.reduce((range, config) => {
      const price = parseFloat(config.monthlyHwPrice.amount);
      return {
        min: Math.min(range.min, price),
        max: Math.max(range.max, price)
      };
    }, { min: Infinity, max: 0 });

    return new Response(JSON.stringify({
      success: true,
      summary: {
        availableConfigurations: availableCount,
        regions,
        priceRange: priceRange.min !== Infinity ? priceRange : { min: 0, max: 0 }
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600'
      },
    });

  } catch (error) {
    console.error('[DATAPACKET AVAILABILITY ERROR]', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}