import { getUserContext } from "@/lib/server-context";
import { listProspects } from "@/db/prospects";
import { ProspectsPageClient } from "./ProspectsPageClient";

export default async function ProspectsPage() {
  const ctx = await getUserContext();
  if (!ctx) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold">Session expired</h1>
      </div>
    );
  }
  const prospects = await listProspects(ctx.orgId);
  return <ProspectsPageClient initialProspects={prospects} />;
}
