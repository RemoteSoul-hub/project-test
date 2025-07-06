import { db } from '@/lib/db';

export async function GET() {
  const [rows] = await db.query('SELECT * FROM memories');
  return Response.json(rows);
}