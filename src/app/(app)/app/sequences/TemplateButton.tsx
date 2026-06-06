"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wand2, X, Mail, Clock, ArrowRight, Hammer, Sparkles, Landmark } from "lucide-react";
import { templatesForMode, type SequenceTemplate } from "@/lib/sequence-templates";
import type { WorkspaceMode } from "@/lib/pipeline";
import { createFromTemplateAction } from "./actions";

const MODE_ICON: Record<WorkspaceMode, React.ReactNode> = {
  agency: <Sparkles className="h-4 w-4" />,
  lending: <Landmark className="h-4 w-4" />,
  contractor: <Hammer className="h-4 w-4" />,
};

const MODE_LABEL: Record<WorkspaceMode, string> = {
  agency: "AGENCY",
  lending: "LENDING",
  contractor: "BLUE COLLAR",
};

export function TemplateButton({ workspaceMode }: { workspaceMode: WorkspaceMode }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const templates = templatesForMode(workspaceMode);

  function instantiate(t: SequenceTemplate) {
    setCreating(t.id);
    startTransition(async () => {
      const seq = await createFromTemplateAction(t.id);
      setOpen(false);
      setCreating(null);
      if (seq?.id) router.push(`/app/sequences/${seq.id}`);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
      >
        <Wand2 className="h-4 w-4" />
        Start from template
      </button>

      {open && (
        <>
          <div
            onClick={() => !creating && setOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-12 sm:pt-16">
            <div className="w-full max-w-xl rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
              <div className="flex items-start justify-between border-b border-[color:var(--color-border)] p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[color:var(--color-accent-soft)] p-2">
                    <Wand2 className="h-4 w-4 text-[color:var(--color-accent)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Sequence templates</h2>
                    <p className="text-xs text-[color:var(--color-foreground-dim)]">
                      Pre-written cadences. Pick one — you can edit every step after.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !creating && setOpen(false)}
                  disabled={creating !== null}
                  className="rounded-lg p-1.5 text-[color:var(--color-foreground-dim)] hover:bg-[color:var(--color-surface-2)] hover:text-foreground disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[65vh] space-y-2.5 overflow-y-auto p-4">
                {templates.map((t) => {
                  const emailCount = t.steps.filter((s) => s.kind === "email").length;
                  const totalDays = t.steps
                    .filter((s) => s.kind === "wait")
                    .reduce((sum, s) => sum + (s.kind === "wait" ? s.waitDays : 0), 0);
                  const recommended = t.mode === workspaceMode;
                  return (
                    <button
                      key={t.id}
                      onClick={() => instantiate(t)}
                      disabled={creating !== null}
                      className={`group flex w-full items-start justify-between gap-3 rounded-xl border p-4 text-left transition-all disabled:opacity-50 ${
                        recommended
                          ? "border-[color:var(--color-accent-ring)] bg-[color:var(--color-accent-soft)]"
                          : "border-[color:var(--color-border)] bg-background hover:border-[color:var(--color-border-strong)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold">{t.name}</span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              recommended
                                ? "bg-[color:var(--color-accent)] text-black"
                                : "bg-[color:var(--color-surface-2)] text-[color:var(--color-foreground-muted)]"
                            }`}
                          >
                            {MODE_ICON[t.mode]}
                            {MODE_LABEL[t.mode]}
                          </span>
                          {recommended && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--color-accent)]">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-foreground-dim)]">
                          {t.description}
                        </p>
                        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[color:var(--color-foreground-dim)]">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="mono-stat text-foreground">{emailCount}</span> emails
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="mono-stat text-foreground">{totalDays}d</span> cadence
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-[color:var(--color-accent)]" />
                            AI-personalized
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center">
                        {creating === t.id ? (
                          <span className="text-[11px] font-bold text-[color:var(--color-accent)]">
                            Creating…
                          </span>
                        ) : (
                          <ArrowRight className="h-4 w-4 text-[color:var(--color-foreground-muted)] transition-transform group-hover:translate-x-0.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
