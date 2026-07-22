import { Pool, type QueryResultRow } from "pg";

declare global {
  var __syncDbPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.SYNC_DATABASE_URL;
  if (!connectionString) {
    throw new Error("SYNC_DATABASE_URL is not set");
  }
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
}

// Reuse the pool across hot reloads / serverless invocations.
const pool = global.__syncDbPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  global.__syncDbPool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
