import { Pool, type QueryResult, type QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI,
});

const client = await pool.connect();
console.log('Connected to PostgreSQL database 🚀');
client.release();

export default function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}
