import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getUserContext } from "@/lib/server-context";
import { listProspects } from "@/db/prospects";
import { PipelineClient } from "./PipelineClient";
import { db } from "@/db";
import { organizations, users as usersTbl } from "@/db/schema";

export default async function DashboardPage() {
  let ctx = await getUserContext();

  // DEMO_MODE fallback: render against the seed org so we can verify the
  // dashboard without a real signed-in user. Removed before launch.
  if (!ctx && process.env.FUNNELCLOSER_DEMO === "1" && db) {
    const seedUser = (
      await db.select({ id: usersTbl.id }).from(usersTbl).where(eq(usersTbl.clerkId, "seed_user_funnelcloser_test")).limit(1)
    )[0];
    if (seedUser) {
      const seedOrg = (
        await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.ownerId, seedUser.id)).limit(1)
      )[0];
      if (seedOrg) ctx = { userId: seedUser.id, orgId: seedOrg.id };
    }
  }

  if (!ctx) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Session expired</h1>
        <p className="mt-2 text-[color:var(--color-foreground-dim)]">
          Please sign in again to view your pipeline.
        </p>
      </div>
    );
  }

  const [prospects, user] = await Promise.all([listProspects(ctx.orgId), currentUser()]);

  return (
    <PipelineClient
      initialProspects={prospects}
      orgId={ctx.orgId}
      userFirstName={user?.firstName ?? null}
    />
  );
}
