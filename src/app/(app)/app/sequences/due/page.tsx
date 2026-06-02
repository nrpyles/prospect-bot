import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUserContext } from "@/lib/server-context";
import { listDueEnrollments } from "@/db/sequences";
import { eq, asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { sequenceSteps } from "@/db/schema";
import { DueActionsClient, type DueItem } from "./DueActionsClient";
import { toUiProspect } from "@/db/prospects";

export default async function DueActionsPage() {
  const ctx = await getUserContext();
  if (!ctx) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold">Session expired</h1>
      </div>
    );
  }

  const due = ctx && db ? await listDueEnrollments(ctx.orgId) : [];

  // Fetch all steps for any sequences appearing in the due list so we can
  // resolve the step content for each enrollment.
  const sequenceIds = [...new Set(due.map((d) => d.sequence.id))];
  const allSteps = db && sequenceIds.length > 0
    ? await db
        .select()
        .from(sequenceSteps)
        .where(inArray(sequenceSteps.sequenceId, sequenceIds))
        .orderBy(asc(sequenceSteps.position))
    : [];

  const items: DueItem[] = due.map((row) => {
    const stepsForSeq = allSteps.filter((s) => s.sequenceId === row.sequence.id);
    const stepCount = stepsForSeq.filter((s) => s.kind === "email").length;
    const step = stepsForSeq[row.enrollment.currentStepPosition];
    const emailIndex = stepsForSeq
      .slice(0, row.enrollment.currentStepPosition + 1)
      .filter((s) => s.kind === "email").length;
    return {
      enrollmentId: row.enrollment.id,
      sequenceId: row.sequence.id,
      sequenceName: row.sequence.name,
      prospect: toUiProspect(row.prospect),
      stepPosition: row.enrollment.currentStepPosition,
      stepNumber: emailIndex,
      stepCount,
      step: step
        ? {
            kind: step.kind as "email" | "wait" | "task",
            subject: step.subject ?? "",
            body: step.body ?? "",
            useAiDraft: step.useAiDraft,
          }
        : null,
      nextActionAt: row.enrollment.nextActionAt?.toISOString() ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 lg:py-12">
      <Link
        href="/app/sequences"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All sequences
      </Link>

      <div className="mb-8">
        <p className="eyebrow mb-2">DUE NOW</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          {items.length === 0
            ? "Nothing due right now."
            : items.length === 1
              ? "1 sequence touch ready to send."
              : `${items.length} sequence touches ready to send.`}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[color:var(--color-foreground-dim)]">
          For each one: copy the email, paste into your Gmail, send, then click <strong>Mark sent</strong> to advance the prospect to the next step in the sequence.
        </p>
      </div>

      <DueActionsClient items={items} />
    </div>
  );
}
