import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { pgConnection } from "./url";

const globalForDb = globalThis as unknown as { pool?: Pool };

// Reuse one pool across hot reloads in dev.
const conn = pgConnection(process.env.DATABASE_URL);
const pool = globalForDb.pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

function createPool() {
  const pool = new Pool({
    connectionString: conn.url,
    // Supabase's pooler certificate isn't in Node's CA store; the connection is still encrypted.
    ssl: conn.options.ssl ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
    // Fail fast instead of hanging until the platform's 300s function timeout.
    query_timeout: 20_000,
  });
  // A dropped idle connection must not crash the process; the pool replaces it on next use.
  pool.on("error", (err) => console.error("Postgres pool error", err));
  // On Vercel (Fluid compute), close idle connections before the instance is suspended, so a
  // request never picks up a socket the pooler already closed (the cause of hanging requests).
  attachDatabasePool(pool);
  return pool;
}

export const db = drizzle(pool, { schema });
export * from "./schema";
