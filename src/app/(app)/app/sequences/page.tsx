import Link from "next/link";
import { Plus, Users, Repeat, Pause } from "lucide-react";
import { getUserContext } from "@/lib/server-context";
import { listSequences } from "@/db/sequences";
import { CreateSequenceButton } from "./CreateSequenceButton";

export default async function SequencesPage() {
  const ctx = await getUserContext();
  if (!ctx) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold">Session expired</h1>
      </div>
    );
  }

  const seqs = await listSequences(ctx.orgId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">SEQUENCES</p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Multi-touch outreach.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[color:var(--color-foreground-dim)]">
            Build a sequence once. Enroll prospects. Each step surfaces in
            Today&apos;s Playbook when it&apos;s due — draft, send, mark, advance.
          </p>
        </div>
        <CreateSequenceButton />
      </div>

      {seqs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {seqs.map((seq) => {
            const emailSteps = seq.steps.filter((s) => s.kind === "email").length;
            const totalDays = seq.steps
              .filter((s) => s.kind === "wait")
              .reduce((sum, s) => sum + (s.waitDays ?? 0), 0);
            return (
              <Link
                key={seq.id}
                href={`/app/sequences/${seq.id}`}
                className="group rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition-all hover:-translate-y-0.5 hover:border-[color:var(--color-accent-ring)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold leading-tight">{seq.name}</div>
                    {seq.description && (
                      <p className="mt-1 text-xs text-[color:var(--color-foreground-dim)] line-clamp-2">
                        {seq.description}
                      </p>
                    )}
                  </div>
                  {seq.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--color-status-won)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-status-won)]">
                      <Repeat className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-foreground-muted)]">
                      <Pause className="h-3 w-3" />
                      Draft
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-4 text-[11px] text-[color:var(--color-foreground-dim)]">
                  <span>
                    <span className="mono-stat text-[color:var(--color-foreground)]">{emailSteps}</span>{" "}
                    email{emailSteps === 1 ? "" : "s"}
                  </span>
                  {totalDays > 0 && (
                    <span>
                      <span className="mono-stat text-[color:var(--color-foreground)]">{totalDays}d</span> long
                    </span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="mono-stat text-[color:var(--color-foreground)]">
                      {seq.enrollmentCount}
                    </span>{" "}
                    enrolled
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] p-10 text-center lg:p-16">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-accent-soft)]">
        <Plus className="h-5 w-5 text-[color:var(--color-accent)]" />
      </div>
      <h2 className="mt-5 text-xl font-extrabold tracking-tight md:text-2xl">
        No sequences yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[color:var(--color-foreground-dim)]">
        Build your first sequence — email → wait → follow-up → wait → breakup.
        Then enroll prospects from your pipeline.
      </p>
      <div className="mt-6">
        <CreateSequenceButton variant="primary" />
      </div>
    </div>
  );
}
