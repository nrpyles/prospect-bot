/**
 * End-to-end DB verification:
 *   - finds (or creates) a test org
 *   - inserts the same mock prospects we use in dev
 *   - reads them back via the production query helpers
 *
 * Run: pnpm tsx scripts/seed-and-verify.ts
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { users, organizations, orgMembers } from "../src/db/schema";
import { MOCK_PROSPECTS } from "../src/lib/mock-prospects";

async function run() {
  const url = process.env.DATABASE_URL!;
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client, { schema: { users, organizations, orgMembers } });

  // Find or create a "verification" user/org
  const SEED_CLERK_ID = "seed_user_funnelcloser_test";
  let userRow = (await db.select().from(users).where(eq(users.clerkId, SEED_CLERK_ID)).limit(1))[0];
  if (!userRow) {
    [userRow] = await db
      .insert(users)
      .values({
        clerkId: SEED_CLERK_ID,
        email: "seed@funnelcloser.test",
        name: "Seed User",
      })
      .returning();
    console.log("Created seed user:", userRow.id);
  } else {
    console.log("Reusing seed user:", userRow.id);
  }

  let orgRow = (
    await db.select().from(organizations).where(eq(organizations.ownerId, userRow.id)).limit(1)
  )[0];
  if (!orgRow) {
    [orgRow] = await db
      .insert(organizations)
      .values({
        name: "Seed Workspace",
        slug: `seed-${userRow.id.slice(0, 8)}`,
        ownerId: userRow.id,
      })
      .returning();
    await db.insert(orgMembers).values({ orgId: orgRow.id, userId: userRow.id, role: "owner" });
    console.log("Created seed org:", orgRow.id);
  } else {
    console.log("Reusing seed org:", orgRow.id);
  }

  // Insert prospects via the same helper the API uses
  const { insertProspects, listProspects } = await import("../src/db/prospects");

  const newlyInserted = await insertProspects(
    orgRow.id,
    MOCK_PROSPECTS.map((p) => ({
      name: p.name,
      ownerName: p.ownerName,
      industry: p.industry,
      city: p.city,
      phone: p.phone,
      email: p.email,
      website: p.website,
      quality: p.quality,
      qualityIssues: p.qualityIssues,
      rating: p.rating,
      reviewCount: p.reviewCount,
      status: p.status,
      source: p.source,
      packageName: p.packageName,
      valueCents: p.valueCents,
      notes: p.notes,
    })),
  );
  console.log(`Inserted ${newlyInserted.length} new prospects (duplicates ignored).`);

  // Read back via listProspects
  const all = await listProspects(orgRow.id);
  console.log(`\nVerified read-back: ${all.length} prospects in org ${orgRow.id}`);
  for (const p of all.slice(0, 5)) {
    console.log(`  · ${p.name.padEnd(35)} ${p.status.padEnd(18)} ${p.quality}`);
  }
  if (all.length > 5) console.log(`  · ... and ${all.length - 5} more`);

  await client.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
