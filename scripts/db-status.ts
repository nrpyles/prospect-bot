/**
 * Quick DB sanity check — lists tables and row counts.
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

  const tables = await sql<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;

  console.log(`Found ${tables.length} tables:`);
  for (const t of tables) {
    const [{ n }] = await sql<Array<{ n: number }>>`
      SELECT COUNT(*)::int AS n FROM ${sql(t.tablename)}
    `;
    console.log(`  ${t.tablename.padEnd(30)} ${n} rows`);
  }

  await sql.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
