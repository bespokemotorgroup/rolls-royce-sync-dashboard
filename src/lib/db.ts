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

// Created lazily (on first query) rather than at module load, since Next.js
// imports route modules during the build's page-data collection step even
// for force-dynamic pages, which would otherwise fail the build if env vars
// aren't present at build time.
function getPool(): Pool {
  if (!global.__syncDbPool) {
    global.__syncDbPool = createPool();
  }
  return global.__syncDbPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
