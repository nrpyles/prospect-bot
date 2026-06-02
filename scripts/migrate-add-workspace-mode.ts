/**
 * One-shot migration: add workspace_mode enum + columns to organizations.
 * Run: pnpm tsx scripts/migrate-add-workspace-mode.ts
 *
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
    console.log("Creating workspace_mode enum…");
    await sql`
      DO $$ BEGIN
        CREATE TYPE workspace_mode AS ENUM ('agency', 'lending');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `;

    console.log("Adding workspace_mode column to organizations…");
    await sql`
      ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS workspace_mode workspace_mode NOT NULL DEFAULT 'agency'
    `;

    console.log("Adding sender_name + sender_company columns…");
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sender_name text`;
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sender_company text`;

    console.log("Done.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
