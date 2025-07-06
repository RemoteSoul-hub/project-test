// import mysql from 'mysql2/promise';

import { staticComponents } from '../../../../data/staticComponents'; 

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const component = staticComponents.find(
      (comp) => comp.id === parseInt(id, 10) && comp.available === true
    );

    // Mimic the [rows] structure from DB query result for consistency
    const rows = component ? [component] : []; 

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Component not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[API COMPONENT ERROR - STATIC DATA]', err);
    return new Response(JSON.stringify({ error: 'Internal server error processing static data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}