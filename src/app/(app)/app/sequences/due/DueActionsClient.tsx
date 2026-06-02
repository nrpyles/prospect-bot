"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Mail,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  RefreshCw,
  Pause,
  X,
} from "lucide-react";
import type { Prospect } from "@/lib/mock-prospects";
import { advanceEnrollmentAction, unenrollAction } from "../actions";

export type DueItem = {
  enrollmentId: string;
  sequenceId: string;
  sequenceName: string;
  prospect: Prospect;
  stepPosition: number;
  stepNumber: number;
  stepCount: number;
  step: { kind: "email" | "wait" | "task"; subject: string; body: string; useAiDraft: boolean } | null;
  nextActionAt: string | null;
};

function fillTemplate(text: string, p: Prospect) {
  return text
    .replace(/\{\{\s*name\s*\}\}/gi, p.name)
    .replace(/\{\{\s*industry\s*\}\}/gi, p.industry)
    .replace(/\{\{\s*city\s*\}\}/gi, p.city)
    .replace(/\{\{\s*website\s*\}\}/gi, p.website ?? "")
    .replace(/\{\{\s*owner\s*\}\}/gi, p.ownerName ?? "");
}

export function DueActionsClient({ items }: { items: DueItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.enrollmentId ?? null);
  const [draftCache, setDraftCache] = useState<Record<string, { subject: string; body: string; reasoning: string }>>({});
  const [drafting, setDrafting] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [processed, setProcessed] = useState<Set<string>>(new Set());

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] p-10 text-center lg:p-16">
        <Clock className="mx-auto h-8 w-8 text-[color:var(--color-foreground-muted)]" />
        <h2 className="mt-4 text-xl font-extrabold tracking-tight">All clear.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[color:var(--color-foreground-dim)]">
          No sequence steps are due right now. Check back later, or enroll more prospects.
        </p>
        <Link
          href="/app/sequences"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-4 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)]"
        >
          View sequences
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  function toggle(id: string) {
    setOpen((prev) => (prev === id ? null : id));
  }

  async function generateAiDraft(item: DueItem) {
    setDrafting(item.enrollmentId);
    setDraftError((e) => ({ ...e, [item.enrollmentId]: "" }));
    try {
      const res = await fetch(`/api/prospects/${item.prospect.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        setDraftError((e) => ({
          ...e,
          [item.enrollmentId]:
            res.status === 504
              ? "Claude took too long — try again."
              : `Server error (${res.status}). ${text.slice(0, 120)}`,
        }));
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setDraftError((e) => ({ ...e, [item.enrollmentId]: data.error ?? "Draft failed" }));
        return;
      }
      setDraftCache((d) => ({
        ...d,
        [item.enrollmentId]: { subject: data.subject, body: data.body, reasoning: data.reasoning ?? "" },
      }));
    } catch (e) {
      setDraftError((err) => ({
        ...err,
        [item.enrollmentId]: e instanceof Error ? e.message : String(e),
      }));
    } finally {
      setDrafting(null);
    }
  }

  function getResolved(item: DueItem) {
    if (!item.step) return null;
    if (draftCache[item.enrollmentId]) return draftCache[item.enrollmentId];
    return {
      subject: fillTemplate(item.step.subject, item.prospect),
      body: fillTemplate(item.step.body, item.prospect),
      reasoning: "",
    };
  }

  async function copy(item: DueItem) {
    const r = getResolved(item);
    if (!r) return;
    await navigator.clipboard.writeText(`Subject: ${r.subject}\n\n${r.body}`);
    setCopied(item.enrollmentId);
    setTimeout(() => setCopied(null), 1500);
  }

  function markSent(item: DueItem) {
    startTransition(async () => {
      await advanceEnrollmentAction(item.enrollmentId);
      setProcessed((s) => new Set(s).add(item.enrollmentId));
    });
  }

  function pause(item: DueItem) {
    startTransition(async () => {
      await unenrollAction(item.enrollmentId);
      setProcessed((s) => new Set(s).add(item.enrollmentId));
    });
  }

  const active = items.filter((i) => !processed.has(i.enrollmentId));
  const completed = items.filter((i) => processed.has(i.enrollmentId));

  return (
    <div className="space-y-3">
      {active.map((item) => {
        const isOpen = open === item.enrollmentId;
        const resolved = getResolved(item);
        const isDrafting = drafting === item.enrollmentId;
        const err = draftError[item.enrollmentId];
        return (
          <div
            key={item.enrollmentId}
            className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
          >
            <button
              onClick={() => toggle(item.enrollmentId)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-accent-soft)]">
                  <Mail className="h-4 w-4 text-[color:var(--color-accent)]" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{item.prospect.name}</div>
                  <div className="mt-0.5 truncate text-xs text-[color:var(--color-foreground-dim)]">
                    {item.sequenceName} · step{" "}
                    <span className="mono-stat text-foreground">{item.stepNumber}</span>
                    {item.stepCount > 0 && `/${item.stepCount}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[color:var(--color-foreground-muted)]">
                {item.step?.useAiDraft && (
                  <span className="hidden items-center gap-1 rounded-md bg-[color:var(--color-accent-soft)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[color:var(--color-accent)] sm:inline-flex">
                    <Sparkles className="h-2.5 w-2.5" />
                    AI
                  </span>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {isOpen && item.step && (
              <div className="border-t border-[color:var(--color-border)] p-4">
                {item.step.useAiDraft && !draftCache[item.enrollmentId] && (
                  <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-[color:var(--color-accent-ring)] bg-[color:var(--color-accent-soft)] p-3">
                    <div className="flex items-start gap-2 text-xs text-[color:var(--color-foreground-dim)]">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[color:var(--color-accent)]" />
                      <span>
                        This step is set to <strong className="text-[color:var(--color-accent)]">AI-personalize</strong>.
                        Click <strong>Draft with Claude</strong> below to generate a custom email based on{" "}
                        {item.prospect.name}&apos;s website issues.
                      </span>
                    </div>
                  </div>
                )}

                {err && (
                  <div className="mb-3 rounded-xl border border-[color:var(--color-quality-none)]/30 bg-[color:var(--color-quality-none)]/10 p-3 text-xs text-[color:var(--color-quality-none)]">
                    {err}
                  </div>
                )}

                {resolved && (
                  <div className="space-y-3">
                    <div>
                      <div className="eyebrow mb-1.5 text-[10px]">SUBJECT</div>
                      <div className="rounded-xl border border-[color:var(--color-border)] bg-background px-3 py-2 text-sm font-bold">
                        {resolved.subject || (
                          <span className="text-[color:var(--color-foreground-muted)]">
                            (no subject — draft with Claude or edit the step)
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="eyebrow mb-1.5 text-[10px]">BODY</div>
                      <pre className="whitespace-pre-wrap rounded-xl border border-[color:var(--color-border)] bg-background p-3 font-sans text-sm leading-relaxed">
{resolved.body || `(empty body — draft with Claude or edit the step in the sequence builder)`}
                      </pre>
                    </div>
                    {resolved.reasoning && (
                      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-2.5 text-xs text-[color:var(--color-foreground-dim)]">
                        <span className="mono-tag mr-2 text-[color:var(--color-foreground-muted)]">WHY</span>
                        {resolved.reasoning}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {item.step.useAiDraft && (
                    <button
                      onClick={() => generateAiDraft(item)}
                      disabled={isDrafting}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] px-3 py-1.5 text-xs font-bold text-[color:var(--color-accent)] transition-colors hover:bg-[color:var(--color-accent)] hover:text-black disabled:opacity-50"
                    >
                      {isDrafting ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Drafting…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          {draftCache[item.enrollmentId] ? "Re-draft with Claude" : "Draft with Claude"}
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => copy(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--color-accent)] px-3 py-1.5 text-xs font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)]"
                  >
                    {copied === item.enrollmentId ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy email
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => markSent(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-status-won)]/40 bg-[color:var(--color-status-won)]/10 px-3 py-1.5 text-xs font-bold text-[color:var(--color-status-won)] transition-colors hover:bg-[color:var(--color-status-won)]/20"
                  >
                    <Check className="h-3 w-3" />
                    Mark sent → advance
                  </button>
                  <button
                    onClick={() => pause(item)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[color:var(--color-foreground-dim)] transition-colors hover:bg-[color:var(--color-quality-none)]/10 hover:text-[color:var(--color-quality-none)]"
                    title="Remove from sequence"
                  >
                    <X className="h-3 w-3" />
                    Unenroll
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {completed.length > 0 && (
        <div className="rounded-2xl border border-[color:var(--color-status-won)]/30 bg-[color:var(--color-status-won)]/5 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[color:var(--color-status-won)]">
            <Check className="h-4 w-4" />
            {completed.length} processed
          </div>
          <div className="mt-1 text-xs text-[color:var(--color-foreground-dim)]">
            These have been advanced (or unenrolled) and won&apos;t appear here again.
          </div>
        </div>
      )}
    </div>
  );
}
