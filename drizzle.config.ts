import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { pgConnection } from "./src/lib/db/url";

config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations need a session connection (Supabase :5432), not the transaction pooler.
  dbCredentials: (() => {
    const { url, options } = pgConnection(process.env.DATABASE_MIGRATE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL);
    const u = new URL(url);
    return {
      host: u.hostname,
      port: Number(u.port || 5432),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.slice(1) || "postgres",
      ssl: options.ssl === "require" ? "require" : false,
    };
  })(),
});
