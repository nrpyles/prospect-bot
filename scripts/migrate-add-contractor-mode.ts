/**
 * Add 'contractor' value to the workspace_mode enum.
 * Idempotent — safe to re-run.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import postgres from "postgres";

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const sql = postgres(url, { max: 1, prepare: false });

  try {
    // ALTER TYPE ... ADD VALUE IF NOT EXISTS — Postgres 12+
    console.log("Adding 'contractor' to workspace_mode enum…");
    await sql`ALTER TYPE workspace_mode ADD VALUE IF NOT EXISTS 'contractor'`;
    console.log("Done.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
