"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, Copy, Check, AlertCircle, ArrowLeft } from "lucide-react";
import type { Prospect } from "@/lib/mock-prospects";

type Draft = { subject: string; body: string; reasoning: string };

export function AIDraftView({
  prospect,
  onBack,
}: {
  prospect: Prospect;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"subject" | "body" | "full" | null>(null);

  useEffect(() => {
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect.id]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to draft email");
        return;
      }
      setDraft(data as Draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, key: "subject" | "body" | "full") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to details
        </button>
        <div className="eyebrow flex items-center gap-1.5 text-[10px]">
          <Sparkles className="h-3 w-3 text-[color:var(--color-accent)]" />
          AI DRAFT · CLAUDE
        </div>
      </div>

      {loading ? (
        <DraftSkeleton />
      ) : error ? (
        <div className="flex items-start gap-2 rounded-xl border border-[color:var(--color-quality-none)]/30 bg-[color:var(--color-quality-none)]/10 p-4 text-sm text-[color:var(--color-quality-none)]">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-bold">Couldn&apos;t generate</div>
            <div className="mt-1 text-xs">{error}</div>
            {error.toLowerCase().includes("api key") && (
              <div className="mt-2 text-xs text-[color:var(--color-foreground-dim)]">
                Set <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px]">ANTHROPIC_API_KEY</code> in your
                .env.local. Get one at{" "}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  console.anthropic.com
                </a>
                .
              </div>
            )}
            <button
              onClick={generate}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-quality-none)]/30 px-3 py-1.5 text-xs font-semibold"
            >
              <RefreshCw className="h-3 w-3" />
              Try again
            </button>
          </div>
        </div>
      ) : draft ? (
        <>
          {/* Reasoning */}
          {draft.reasoning && (
            <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3 text-xs text-[color:var(--color-foreground-dim)]">
              <span className="eyebrow mr-2 text-[10px]">WHY</span>
              {draft.reasoning}
            </div>
          )}

          {/* Subject */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="eyebrow text-[10px]">SUBJECT</span>
              <button
                onClick={() => copy(draft.subject, "subject")}
                className="inline-flex items-center gap-1 text-[11px] text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
              >
                {copied === "subject" ? (
                  <>
                    <Check className="h-3 w-3 text-[color:var(--color-status-won)]" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="rounded-xl border border-[color:var(--color-border)] bg-background p-3 text-sm font-semibold">
              {draft.subject}
            </div>
          </div>

          {/* Body */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="eyebrow text-[10px]">BODY</span>
              <button
                onClick={() => copy(draft.body, "body")}
                className="inline-flex items-center gap-1 text-[11px] text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
              >
                {copied === "body" ? (
                  <>
                    <Check className="h-3 w-3 text-[color:var(--color-status-won)]" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <pre className="whitespace-pre-wrap rounded-xl border border-[color:var(--color-border)] bg-background p-4 font-sans text-sm leading-relaxed text-foreground">
{draft.body}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={generate}
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3 py-2 text-sm font-semibold transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </button>
            <button
              onClick={() => copy(`Subject: ${draft.subject}\n\n${draft.body}`, "full")}
              className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-4 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)]"
            >
              {copied === "full" ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy full email
                </>
              )}
            </button>
            <button
              disabled
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3 py-2 text-sm font-semibold text-[color:var(--color-foreground-dim)] opacity-50"
              title="Gmail send — Phase 4.5"
            >
              Send via Gmail
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function DraftSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-[color:var(--color-accent)]">
        <Sparkles className="h-4 w-4 animate-pulse" />
        <span className="font-semibold">Claude is reading the prospect&apos;s site issues…</span>
      </div>
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-[color:var(--color-surface-2)]" />
        <div className="h-12 rounded-xl bg-[color:var(--color-surface-2)]" />
        <div className="h-4 w-20 rounded bg-[color:var(--color-surface-2)]" />
        <div className="space-y-2 rounded-xl bg-[color:var(--color-surface-2)] p-4">
          <div className="h-3 w-3/4 rounded bg-[color:var(--color-border-strong)]" />
          <div className="h-3 w-full rounded bg-[color:var(--color-border-strong)]" />
          <div className="h-3 w-5/6 rounded bg-[color:var(--color-border-strong)]" />
          <div className="h-3 w-2/3 rounded bg-[color:var(--color-border-strong)]" />
        </div>
      </div>
    </div>
  );
}
