import Link from "next/link";
import { Search, Clock, Repeat, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { leadSearches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserContext } from "@/lib/server-context";

export default async function SearchesPage() {
  const ctx = await getUserContext();
  const rows =
    ctx && db
      ? await db
          .select()
          .from(leadSearches)
          .where(eq(leadSearches.orgId, ctx.orgId))
          .orderBy(desc(leadSearches.createdAt))
          .limit(50)
      : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8 lg:py-14">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md bg-[color:var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-accent)]">
            Coming next
          </span>
          <p className="eyebrow">SEARCHES</p>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">Saved searches.</h1>
        <p className="mt-3 max-w-2xl text-sm text-[color:var(--color-foreground-dim)] md:text-base">
          Save your favorite city × industry combos and schedule them to run on a cron.
          Every morning, fresh prospects in your pipeline.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] p-10 text-center">
          <Search className="mx-auto h-8 w-8 text-[color:var(--color-foreground-muted)]" />
          <div className="mt-3 text-base font-bold">No saved searches yet</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-[color:var(--color-foreground-dim)]">
            For now, use the <strong>Find prospects</strong> button on your dashboard.
            Saving + scheduling launches with Sequences.
          </p>
          <Link
            href="/app"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-4 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)]"
          >
            <Search className="h-4 w-4" />
            Run a one-off search
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
            >
              <div>
                <div className="text-sm font-bold">{s.name}</div>
                <div className="mt-1 text-xs text-[color:var(--color-foreground-dim)]">
                  {(s.cities as string[]).length} cities · {(s.industries as string[]).length} industries
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.isScheduled ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-status-won)]/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-status-won)]">
                    <Repeat className="h-3 w-3" />
                    Scheduled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-surface-2)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-foreground-muted)]">
                    <Clock className="h-3 w-3" />
                    Manual
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
