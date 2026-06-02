import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUserContext } from "@/lib/server-context";
import { getSequence } from "@/db/sequences";
import { SequenceEditorClient } from "./SequenceEditorClient";

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold">Session expired</h1>
      </div>
    );
  }
  const seq = await getSequence(ctx.orgId, id);
  if (!seq) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8 lg:py-12">
      <Link
        href="/app/sequences"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sequences
      </Link>

      <SequenceEditorClient
        id={seq.id}
        initialName={seq.name}
        initialDescription={seq.description ?? ""}
        initialActive={seq.isActive}
        initialSteps={seq.steps.map((s) => ({
          kind: s.kind as "email" | "wait" | "task",
          subject: s.subject,
          body: s.body,
          useAiDraft: s.useAiDraft,
          waitDays: s.waitDays,
        }))}
      />
    </div>
  );
}
