// Connection strings from Supabase/Prisma setups carry query params meant for other drivers
// (pgbouncer, uselibpqcompat, sslmode…). postgres-js would forward unknown params to the server
// as settings and fail, so strip them and translate sslmode into the `ssl` option.
const FOREIGN_PARAMS = ["pgbouncer", "uselibpqcompat", "sslmode", "connection_limit", "pool_timeout", "schema"];

export function pgConnection(raw: string | undefined): { url: string; options: { ssl: false | "require" } } {
  if (!raw) throw new Error("DATABASE_URL is not set");
  const u = new URL(raw);
  const sslmode = u.searchParams.get("sslmode");
  for (const p of FOREIGN_PARAMS) u.searchParams.delete(p);
  const local = ["localhost", "127.0.0.1"].includes(u.hostname);
  return {
    url: u.toString(),
    options: { ssl: sslmode === "disable" || (local && !sslmode) ? false : "require" },
  };
}
