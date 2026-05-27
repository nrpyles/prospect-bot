/**
 * User / org sync helpers — implements the "upsert on first dashboard load"
 * pattern so we don't need to wire Clerk webhooks for MVP.
 *
 * When a Clerk-authed user hits a protected route, we ensure their `users` row
 * and default `organizations` row exist, then return the org id so subsequent
 * queries can scope to it.
 */
import { db } from "./index";
import { users, organizations, orgMembers } from "./schema";
import { eq } from "drizzle-orm";

export type UserContext = {
  userId: string; // our internal users.id
  orgId: string; // our internal organizations.id
};

export async function ensureUserAndOrg(input: {
  clerkId: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
}): Promise<UserContext> {
  if (!db) throw new Error("DATABASE_URL is not set");

  // Try to find existing user
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, input.clerkId))
    .limit(1);

  let userId: string;
  if (existing.length > 0) {
    userId = existing[0].id;
  } else {
    const inserted = await db
      .insert(users)
      .values({
        clerkId: input.clerkId,
        email: input.email,
        name: input.name ?? null,
        imageUrl: input.imageUrl ?? null,
      })
      .returning({ id: users.id });
    userId = inserted[0].id;
  }

  // Find or create default org owned by this user
  const existingOrg = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.ownerId, userId))
    .limit(1);

  let orgId: string;
  if (existingOrg.length > 0) {
    orgId = existingOrg[0].id;
  } else {
    const orgName = input.name ? `${input.name}'s Workspace` : "My Workspace";
    const slug = `org-${userId.slice(0, 8)}`;
    const insertedOrg = await db
      .insert(organizations)
      .values({ name: orgName, slug, ownerId: userId })
      .returning({ id: organizations.id });
    orgId = insertedOrg[0].id;

    await db.insert(orgMembers).values({
      orgId,
      userId,
      role: "owner",
    });
  }

  return { userId, orgId };
}
