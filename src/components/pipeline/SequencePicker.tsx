"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { X, Sparkles, Mail, Clock, Check, Plus, ArrowRight } from "lucide-react";
import { enrollProspectsAction } from "@/app/(app)/app/sequences/actions";

type SequenceSummary = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  emailSteps: number;
  totalDays: number;
  enrollmentCount: number;
};

export function SequencePicker({
  open,
  prospectId,
  prospectName,
  onClose,
  onEnrolled,
}: {
  open: boolean;
  prospectId: string;
  prospectName: string;
  onClose: () => void;
  onEnrolled?: (sequenceId: string) => void;
}) {
  const [sequences, setSequences] = useState<SequenceSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, startTransition] = useTransition();
  const [enrolledId, setEnrolledId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSequences(null);
      setError(null);
      setEnrolledId(null);
      return;
    }
    void (async () => {
      try {
        const res = await fetch("/api/sequences");
        if (!res.ok) {
          setError("Couldn't load sequences.");
          return;
        }
        const data = await res.json();
        setSequences(data.sequences as SequenceSummary[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [open]);

  function enroll(seq: SequenceSummary) {
    startTransition(async () => {
      try {
        await enrollProspectsAction(seq.id, [prospectId]);
        setEnrolledId(seq.id);
        onEnrolled?.(seq.id);
        setTimeout(() => onClose(), 900);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
      <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-16 sm:p-8">
        <div className="w-full max-w-lg rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
          <div className="flex items-start justify-between border-b border-[color:var(--color-border)] p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[color:var(--color-accent-soft)] p-2">
                <Sparkles className="h-4 w-4 text-[color:var(--color-accent)]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold">Enroll in sequence</h2>
                <p className="truncate text-xs text-[color:var(--color-foreground-dim)]">
                  Adding <strong>{prospectName}</strong> to a sequence.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[color:var(--color-foreground-dim)] hover:bg-[color:var(--color-surface-2)] hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-3">
            {error && (
              <div className="mb-3 rounded-xl border border-[color:var(--color-quality-none)]/30 bg-[color:var(--color-quality-none)]/10 p-3 text-sm text-[color:var(--color-quality-none)]">
                {error}
              </div>
            )}

            {sequences === null && !error && (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-[color:var(--color-surface-2)]" />
                ))}
              </div>
            )}

            {sequences && sequences.length === 0 && (
              <div className="rounded-xl border border-dashed border-[color:var(--color-border-strong)] bg-background p-8 text-center">
                <p className="text-sm font-bold">No sequences yet</p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-[color:var(--color-foreground-dim)]">
                  Create your first sequence — multi-touch outreach without spreadsheets.
                </p>
                <Link
                  href="/app/sequences"
                  onClick={onClose}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-4 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Build a sequence
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {sequences && sequences.length > 0 && (
              <div className="space-y-2">
                {sequences.map((seq) => (
                  <button
                    key={seq.id}
                    onClick={() => enroll(seq)}
                    disabled={enrolling || enrolledId !== null}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] bg-background p-3 text-left transition-all hover:border-[color:var(--color-accent-ring)] disabled:opacity-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{seq.name}</span>
                        {seq.isActive ? (
                          <span className="mono-tag text-[color:var(--color-status-won)]">ACTIVE</span>
                        ) : (
                          <span className="mono-tag text-[color:var(--color-foreground-muted)]">DRAFT</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-[color:var(--color-foreground-dim)]">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="mono-stat text-foreground">{seq.emailSteps}</span> emails
                        </span>
                        {seq.totalDays > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="mono-stat text-foreground">{seq.totalDays}d</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {enrolledId === seq.id ? (
                      <Check className="h-4 w-4 flex-shrink-0 text-[color:var(--color-status-won)]" />
                    ) : (
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-[color:var(--color-foreground-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[color:var(--color-border)] p-3">
            <Link
              href="/app/sequences"
              onClick={onClose}
              className="text-xs font-semibold text-[color:var(--color-accent)] transition-colors hover:underline"
            >
              + New sequence
            </Link>
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[color:var(--color-foreground-dim)] transition-colors hover:bg-[color:var(--color-surface-2)] hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
