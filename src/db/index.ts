import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== "development") {
  throw new Error("DATABASE_URL is required");
}

// Lazy singleton — supports HMR in dev and avoids opening a connection
// just by importing this module.
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

export const client =
  globalForDb.client ??
  (connectionString ? postgres(connectionString, { max: 10, prepare: false }) : null);

if (process.env.NODE_ENV !== "production" && client) {
  globalForDb.client = client;
}

export const db = client ? drizzle(client, { schema }) : null;
export { schema };
