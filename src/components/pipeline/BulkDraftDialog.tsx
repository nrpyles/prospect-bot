"use client";

import { useEffect, useRef, useState } from "react";
import { X, Sparkles, Copy, Check, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import type { Prospect } from "@/lib/mock-prospects";

type DraftState = {
  prospectId: string;
  status: "queued" | "drafting" | "done" | "error";
  subject?: string;
  body?: string;
  reasoning?: string;
  error?: string;
};

export function BulkDraftDialog({
  open,
  prospects,
  onClose,
  onAutoAdvance,
}: {
  open: boolean;
  prospects: Prospect[];
  onClose: () => void;
  /** Called when user marks a prospect "sent" — moves them to Email Sent in DB. */
  onAutoAdvance?: (prospectId: string) => Promise<void> | void;
}) {
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [markedSent, setMarkedSent] = useState<Set<string>>(new Set());
  const abortRef = useRef(false);

  useEffect(() => {
    if (open && prospects.length > 0) {
      const initial: Record<string, DraftState> = {};
      for (const p of prospects) initial[p.id] = { prospectId: p.id, status: "queued" };
      setDrafts(initial);
      setMarkedSent(new Set());
      setExpanded(new Set([prospects[0].id]));
    }
  }, [open, prospects]);

  useEffect(() => {
    if (!open) {
      abortRef.current = true;
      setRunning(false);
    } else {
      abortRef.current = false;
    }
  }, [open]);

  async function startDrafting() {
    setRunning(true);
    for (const p of prospects) {
      if (abortRef.current) break;
      setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], status: "drafting" } }));
      try {
        const res = await fetch(`/api/prospects/${p.id}/draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (!res.ok) {
          setDrafts((d) => ({
            ...d,
            [p.id]: { ...d[p.id], status: "error", error: data.error ?? "Failed" },
          }));
          continue;
        }
        setDrafts((d) => ({
          ...d,
          [p.id]: {
            ...d[p.id],
            status: "done",
            subject: data.subject,
            body: data.body,
            reasoning: data.reasoning,
          },
        }));
      } catch (err) {
        setDrafts((d) => ({
          ...d,
          [p.id]: { ...d[p.id], status: "error", error: err instanceof Error ? err.message : String(err) },
        }));
      }
    }
    setRunning(false);
  }

  function toggleExpand(id: string) {
    setExpanded((e) => {
      const next = new Set(e);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copyDraft(p: Prospect, draft: DraftState) {
    if (!draft.subject || !draft.body) return;
    const text = `Subject: ${draft.subject}\n\n${draft.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(p.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  }

  async function markSent(p: Prospect) {
    setMarkedSent((s) => new Set(s).add(p.id));
    if (onAutoAdvance) await onAutoAdvance(p.id);
  }

  const total = prospects.length;
  const done = Object.values(drafts).filter((d) => d.status === "done").length;
  const errors = Object.values(drafts).filter((d) => d.status === "error").length;
  const inProgress = Object.values(drafts).filter((d) => d.status === "drafting").length;
  const allDone = total > 0 && done + errors === total;

  if (!open) return null;

  return (
    <>
      <div
        onClick={running ? undefined : onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-12 sm:p-8 sm:pt-16">
        <div className="w-full max-w-3xl rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[color:var(--color-border)] p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[color:var(--color-accent-soft)] p-2.5">
                <Sparkles className="h-5 w-5 text-[color:var(--color-accent)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Bulk draft</h2>
                <p className="mt-0.5 text-sm text-[color:var(--color-foreground-dim)]">
                  Claude will write a custom first-touch email for {total} prospect{total === 1 ? "" : "s"}.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={running}
              className="rounded-lg p-2 text-[color:var(--color-foreground-dim)] transition-colors hover:bg-[color:var(--color-surface-2)] hover:text-foreground disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress strip */}
          {total > 0 && (
            <div className="border-b border-[color:var(--color-border)] px-6 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 text-[color:var(--color-foreground-dim)]">
                <span>{done} done</span>
                {inProgress > 0 && (
                  <span className="text-[color:var(--color-accent)]">
                    <Sparkles className="mr-1 inline h-3 w-3 animate-pulse" />
                    {inProgress} drafting
                  </span>
                )}
                {errors > 0 && <span className="text-[color:var(--color-quality-none)]">{errors} errors</span>}
                <span>{total - done - errors - inProgress} queued</span>
              </div>
              <div className="mono-stat text-[color:var(--color-foreground-dim)]">
                {done + errors}/{total}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto p-4">
            <div className="space-y-2">
              {prospects.map((p) => {
                const draft = drafts[p.id] ?? { prospectId: p.id, status: "queued" as const };
                const isOpen = expanded.has(p.id);
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-[color:var(--color-border)] bg-background"
                  >
                    {/* Row */}
                    <button
                      onClick={() => toggleExpand(p.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <StatusDot status={draft.status} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">{p.name}</div>
                          <div className="truncate text-xs text-[color:var(--color-foreground-dim)]">
                            {p.industry} · {p.city}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[color:var(--color-foreground-muted)]">
                        {markedSent.has(p.id) && (
                          <span className="rounded-md bg-[color:var(--color-status-won)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-status-won)]">
                            Sent
                          </span>
                        )}
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>

                    {/* Expanded draft */}
                    {isOpen && (
                      <div className="border-t border-[color:var(--color-border)] p-4">
                        {draft.status === "queued" && (
                          <p className="text-xs text-[color:var(--color-foreground-muted)]">Waiting in queue…</p>
                        )}
                        {draft.status === "drafting" && (
                          <div className="flex items-center gap-2 text-sm text-[color:var(--color-accent)]">
                            <Sparkles className="h-4 w-4 animate-pulse" />
                            Claude is reading {p.website ?? "the prospect"}…
                          </div>
                        )}
                        {draft.status === "error" && (
                          <div className="flex items-start gap-2 text-sm text-[color:var(--color-quality-none)]">
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>{draft.error}</span>
                          </div>
                        )}
                        {draft.status === "done" && draft.subject && draft.body && (
                          <div className="space-y-3">
                            {draft.reasoning && (
                              <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-2.5 text-xs text-[color:var(--color-foreground-dim)]">
                                <span className="mono-tag mr-2 text-[color:var(--color-foreground-muted)]">WHY</span>
                                {draft.reasoning}
                              </div>
                            )}
                            <div>
                              <div className="eyebrow mb-1.5 text-[10px]">SUBJECT</div>
                              <div className="rounded-lg border border-[color:var(--color-border)] bg-background px-3 py-2 text-sm font-bold">
                                {draft.subject}
                              </div>
                            </div>
                            <div>
                              <div className="eyebrow mb-1.5 text-[10px]">BODY</div>
                              <pre className="whitespace-pre-wrap rounded-lg border border-[color:var(--color-border)] bg-background p-3 font-sans text-sm leading-relaxed">
{draft.body}
                              </pre>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyDraft(p, draft)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--color-accent)] px-3 py-1.5 text-xs font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)]"
                              >
                                {copied === p.id ? (
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
                              {!markedSent.has(p.id) && (
                                <button
                                  onClick={() => markSent(p)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-status-won)]/40 bg-[color:var(--color-status-won)]/10 px-3 py-1.5 text-xs font-bold text-[color:var(--color-status-won)] transition-colors hover:bg-[color:var(--color-status-won)]/20"
                                >
                                  <Check className="h-3 w-3" />
                                  Mark sent → move to Email Sent
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 border-t border-[color:var(--color-border)] p-4">
            <div className="text-xs text-[color:var(--color-foreground-muted)]">
              {allDone
                ? "All drafts ready. Copy and paste into your email client — or mark them sent to auto-advance the pipeline."
                : "Drafts run sequentially (~5–10s each). Don't close while running."}
            </div>
            <div className="flex gap-2">
              {allDone ? (
                <button
                  onClick={onClose}
                  className="rounded-xl bg-[color:var(--color-accent)] px-4 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)]"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    disabled={running}
                    className="rounded-xl border border-[color:var(--color-border-strong)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[color:var(--color-surface-2)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startDrafting}
                    disabled={running || total === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-5 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)] disabled:opacity-50"
                  >
                    {running ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Drafting…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Start drafting
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusDot({ status }: { status: DraftState["status"] }) {
  const color = {
    queued: "var(--color-foreground-muted)",
    drafting: "var(--color-accent)",
    done: "var(--color-status-won)",
    error: "var(--color-quality-none)",
  }[status];
  const animate = status === "drafting";
  return (
    <span
      className={`inline-flex h-2 w-2 flex-shrink-0 rounded-full ${animate ? "animate-pulse" : ""}`}
      style={{ background: color }}
    />
  );
}
