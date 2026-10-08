import { Pool, type QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI,
});

pool
  .connect()
  .then((client) => {
    console.log('Connected to PostgreSQL database 🚀');
    client.release();
  })
  .catch((err) => {
    console.error('Failed to connect to PostgreSQL database:', err);
  });

export default function query(
  text: string,
  params?: unknown[],
): Promise<QueryResult> {
  console.log('Executing query:\n', text);
  return pool.query(text, params);
}
