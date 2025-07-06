import mysql from 'mysql2/promise';

export async function POST(request) {
  try {
    const { cpu_id, memory_id, storage_id, location_id } = await request.json();

    // Validate that all required components are provided
    if (!cpu_id || !memory_id || !storage_id || !location_id) {
      return new Response(JSON.stringify({ 
        error: 'All component IDs are required (cpu_id, memory_id, storage_id, location_id)' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Get all selected components
    const [components] = await connection.execute(
      'SELECT * FROM components WHERE id IN (?, ?, ?, ?) AND available = true',
      [cpu_id, memory_id, storage_id, location_id]
    );

    await connection.end();

    // Validate that all components were found
    if (components.length !== 4) {
      return new Response(JSON.stringify({ 
        error: 'One or more selected components not found or unavailable' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build response with breakdown
    const breakdown = {};
    let total = 0;

    components.forEach(component => {
      breakdown[component.type] = {
        id: component.id,
        name: component.name,
        specs: component.specs,
        price: parseFloat(component.base_price)
      };
      total += parseFloat(component.base_price);
    });

    return new Response(JSON.stringify({
      breakdown,
      total: parseFloat(total.toFixed(2))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[API CALCULATE-PRICE ERROR]', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}