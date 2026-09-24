import { defineConfig } from "drizzle-kit";

/**
 * A TS config (not JSON) so the database URL can come from the environment:
 * `npx drizzle-kit push` then targets the same database the app uses.
 * drizzle-kit loads `.env` automatically.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});
