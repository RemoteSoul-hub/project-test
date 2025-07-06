// import mysql from 'mysql2/promise';

import { staticComponents } from '../../../data/staticComponents'; 

export async function GET() {
  try {

    const rows = staticComponents;
    
    const groupedComponents = rows.reduce((acc, component) => {
      if (!acc[component.type]) {
        acc[component.type] = [];
      }
      acc[component.type].push(component);
      return acc;
    }, {});

    return new Response(JSON.stringify(groupedComponents), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Keep the error handling, but adjust message for static data context
    console.error('[API COMPONENTS ERROR - STATIC DATA]', err);
    return new Response(JSON.stringify({ error: 'Internal server error processing static data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}