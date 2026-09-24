import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Thrown when code tries to talk to Postgres but no `DATABASE_URL` is configured.
 *
 * The pool is created lazily (on first query) rather than at import time: importing
 * `@/db` must never crash module evaluation, otherwise every page that transitively
 * imports it — including the marketing landing page — 500s before it can render.
 */
export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured. Copy .env.example to .env and set it.");
    this.name = "DatabaseNotConfiguredError";
  }
}

const globalForDb = globalThis as typeof globalThis & {
  __deepthinkPool?: Pool;
  __deepthinkDb?: NodePgDatabase;
};

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new DatabaseNotConfiguredError();

  // Cached on globalThis so hot reloads in `next dev` don't leak a pool per recompile.
  if (!globalForDb.__deepthinkPool) {
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
    });
    // Without a listener, an error on an idle client is emitted as an uncaught exception.
    pool.on("error", (err) => console.error("[db] idle client error", err.message));
    globalForDb.__deepthinkPool = pool;
  }
  return globalForDb.__deepthinkPool;
}

export function getDb(): NodePgDatabase {
  if (!globalForDb.__deepthinkDb) {
    globalForDb.__deepthinkDb = drizzle(getPool());
  }
  return globalForDb.__deepthinkDb;
}

/**
 * The drizzle client, created on first use. `db.select()...` reads exactly as before,
 * but a missing/unreachable database surfaces as an error at query time (caught by the
 * `api()` route wrapper) instead of taking the whole app down at boot.
 */
export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_target, prop) {
    const client = getDb();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
  has(_target, prop) {
    return prop in getDb();
  },
  ownKeys() {
    return Reflect.ownKeys(getDb());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getDb(), prop);
  },
});

/** True for "there is no usable database" errors, as opposed to query/logic errors. */
export function isDbUnavailable(err: unknown): boolean {
  const UNAVAILABLE_CODES = new Set([
    "ECONNREFUSED",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ETIMEDOUT",
    "ECONNRESET",
    "EPIPE",
    "28P01", // invalid_password
    "3D000", // invalid_catalog_name
    "53300", // too_many_connections
    "57P01", // admin_shutdown
  ]);

  // Drizzle wraps driver errors (DrizzleQueryError.cause -> pg error), so walk the chain.
  let current: unknown = err;
  for (let depth = 0; current && depth < 6; depth++) {
    if (current instanceof DatabaseNotConfiguredError) return true;
    const code = (current as { code?: string }).code;
    if (code && UNAVAILABLE_CODES.has(code)) return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}
