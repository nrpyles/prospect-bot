import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { getUserContext } from "@/lib/server-context";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const ctx = await getUserContext();
  if (!ctx || !db) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold">Session expired</h1>
      </div>
    );
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, ctx.orgId))
    .limit(1);
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "—";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8 lg:py-14">
      <div className="mb-8">
        <p className="eyebrow mb-2">SETTINGS</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Configure your workspace.</h1>
        <p className="mt-3 text-sm text-[color:var(--color-foreground-dim)]">
          API keys, default search criteria, and your account. Everything is scoped to your workspace.
        </p>
      </div>

      <SettingsClient
        orgName={org?.name ?? "My Workspace"}
        googleMapsApiKey={org?.googleMapsApiKey ?? ""}
        defaultCities={(org?.defaultCities as string[] | null) ?? []}
        defaultIndustries={(org?.defaultIndustries as string[] | null) ?? []}
        email={email}
        hasAnthropicKey={Boolean(process.env.ANTHROPIC_API_KEY)}
      />
    </div>
  );
}
