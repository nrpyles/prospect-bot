/**
 * Apply Drizzle migrations to the database referenced by DATABASE_URL.
 * Run: pnpm tsx scripts/migrate.ts
 *
 * Used in place of `drizzle-kit push` when running in a non-TTY context
 * (Claude Code's bash sandbox, CI, etc.) — drizzle-kit's interactive
 * confirm prompt blocks otherwise.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  console.log("Applying migrations from ./drizzle ...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Done.");
  await client.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
