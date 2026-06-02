"use client";

import { useState } from "react";
import { Mail, Search, Check, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

type EmailCandidate = {
  email: string;
  source: string;
  score: number;
  rationale: string;
};

type FindEmailResult = {
  emails: EmailCandidate[];
  visitedUrls: string[];
  errors: string[];
  autoSaved?: string;
};

export function FindEmailButton({
  prospectId,
  hasWebsite,
  onEmailFound,
}: {
  prospectId: string;
  hasWebsite: boolean;
  onEmailFound: (email: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FindEmailResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  async function findEmails() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/prospects/${prospectId}/find-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        setError(`Server error (${res.status}). ${text.slice(0, 150)}`);
        return;
      }
      const data = (await res.json()) as FindEmailResult & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Couldn't scan website.");
        return;
      }
      setResult(data);
      if (data.autoSaved) {
        onEmailFound(data.autoSaved);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveEmail(email: string) {
    setSaving(email);
    try {
      const res = await fetch(`/api/prospects/${prospectId}/find-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ save: true, email }),
      });
      if (res.ok) {
        onEmailFound(email);
        setResult(null);
      }
    } finally {
      setSaving(null);
    }
  }

  if (!hasWebsite) {
    return (
      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 text-xs text-[color:var(--color-foreground-dim)]">
        Add a website above to enable email discovery.
      </div>
    );
  }

  // Initial state: just a button
  if (!result && !error) {
    return (
      <button
        type="button"
        onClick={findEmails}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm font-semibold text-[color:var(--color-foreground-dim)] transition-colors hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)] hover:text-[color:var(--color-accent)] disabled:opacity-60"
      >
        {busy ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Scanning their website…
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            Find owner email
          </>
        )}
      </button>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[color:var(--color-quality-none)]/30 bg-[color:var(--color-quality-none)]/10 p-3 text-xs">
        <div className="flex items-start gap-2 text-[color:var(--color-quality-none)]">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-bold">Couldn&apos;t scan</div>
            <div className="mt-0.5">{error}</div>
            <button
              onClick={findEmails}
              className="mt-2 inline-flex items-center gap-1 rounded-md border border-[color:var(--color-quality-none)]/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // result is non-null
  return (
    <div className="space-y-2">
      {result!.autoSaved && (
        <div className="flex items-center gap-2 rounded-xl border border-[color:var(--color-status-won)]/30 bg-[color:var(--color-status-won)]/10 p-2.5 text-xs">
          <Check className="h-3.5 w-3.5 text-[color:var(--color-status-won)]" />
          <span>
            Auto-saved <strong className="font-mono">{result!.autoSaved}</strong> (high confidence)
          </span>
        </div>
      )}

      {result!.emails.length === 0 && !result!.autoSaved && (
        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 text-xs text-[color:var(--color-foreground-dim)]">
          No emails found on the homepage or contact pages.{" "}
          {result!.errors.length > 0 && (
            <span className="block mt-1 text-[color:var(--color-foreground-muted)]">
              {result!.errors[0]}
            </span>
          )}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              findEmails();
            }}
            className="mt-2 inline-block text-[color:var(--color-accent)] hover:underline"
          >
            Re-scan
          </a>
        </div>
      )}

      {result!.emails.length > 0 && (
        <div>
          <div className="eyebrow mb-2 text-[10px]">
            FOUND {result!.emails.length} CANDIDATE{result!.emails.length === 1 ? "" : "S"} — TAP TO SAVE
          </div>
          <div className="space-y-1.5">
            {result!.emails.map((c) => (
              <button
                key={c.email}
                onClick={() => saveEmail(c.email)}
                disabled={saving !== null}
                className="group flex w-full items-start justify-between gap-3 rounded-xl border border-[color:var(--color-border)] bg-background p-2.5 text-left transition-colors hover:border-[color:var(--color-accent-ring)] disabled:opacity-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-sm font-bold">{c.email}</div>
                  <div className="mt-0.5 text-[11px] text-[color:var(--color-foreground-dim)]">
                    {c.rationale}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="mono-stat text-[11px] text-[color:var(--color-foreground-muted)]">
                    {c.score}
                  </span>
                  {saving === c.email ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-[color:var(--color-accent)]" />
                  ) : (
                    <Mail className="h-3.5 w-3.5 text-[color:var(--color-foreground-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {result!.visitedUrls.length > 0 && (
        <details className="text-[11px] text-[color:var(--color-foreground-muted)]">
          <summary className="cursor-pointer hover:text-[color:var(--color-foreground-dim)]">
            Scanned {result!.visitedUrls.length} page{result!.visitedUrls.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-1 space-y-0.5">
            {result!.visitedUrls.map((u) => (
              <li key={u} className="truncate">
                <ExternalLink className="mr-1 inline h-2.5 w-2.5" />
                {u}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
