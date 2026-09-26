import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { pgConnection } from "./url";

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

// Reuse one connection pool across hot reloads in dev.
const conn = pgConnection(process.env.DATABASE_URL);
// prepare: false — Supabase's transaction pooler (:6543) doesn't support prepared statements.
const client = globalForDb.pg ?? postgres(conn.url, { ...conn.options, max: 5, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export * from "./schema";
