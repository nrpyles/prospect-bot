"use client";

import { useEffect, useState } from "react";
import { Mail, Check, AlertCircle, Loader2, Unplug } from "lucide-react";

type Status = {
  configured: boolean;
  connected: boolean;
  emailAddress: string | null;
};

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export function GmailConnect({ statusParam }: { statusParam?: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/gmail/status");
      if (res.ok) setStatus(await res.json());
      else setStatus({ configured: false, connected: false, emailAddress: null });
    } catch {
      setStatus({ configured: false, connected: false, emailAddress: null });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function disconnect() {
    setBusy(true);
    await fetch("/api/gmail/disconnect", { method: "POST" });
    await load();
    setBusy(false);
  }

  const banner = (() => {
    switch (statusParam) {
      case "connected":
        return { kind: "ok" as const, text: "Gmail connected — you can now send outreach from your inbox." };
      case "denied":
        return { kind: "err" as const, text: "Google sign-in was cancelled." };
      case "not_configured":
        return { kind: "err" as const, text: "Gmail OAuth isn't configured on the server yet." };
      case "error":
      case "bad_state":
      case "missing_code":
        return { kind: "err" as const, text: "Something went wrong connecting Gmail. Try again." };
      default:
        return null;
    }
  })();

  return (
    <div className="space-y-3">
      {banner && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
            banner.kind === "ok"
              ? "border-[color:var(--color-status-won)]/30 bg-[color:var(--color-status-won)]/10 text-[color:var(--color-status-won)]"
              : "border-[color:var(--color-quality-none)]/30 bg-[color:var(--color-quality-none)]/10 text-[color:var(--color-quality-none)]"
          }`}
        >
          {banner.kind === "ok" ? <Check className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
          <span>{banner.text}</span>
        </div>
      )}

      {status === null ? (
        <div className="flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-sm text-[color:var(--color-foreground-dim)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking Gmail status…
        </div>
      ) : !status.configured ? (
        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-sm text-[color:var(--color-foreground-dim)]">
          <div className="font-bold text-[color:var(--color-quality-terrible)]">Gmail sending isn&apos;t set up yet.</div>
          <p className="mt-1 leading-relaxed">
            The server needs <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs">GOOGLE_OAUTH_CLIENT_ID</code> and{" "}
            <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs">GOOGLE_OAUTH_CLIENT_SECRET</code>{" "}
            configured before users can connect Gmail. Until then, copy-and-paste sending still works everywhere.
          </p>
        </div>
      ) : status.connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--color-status-won)]/30 bg-[color:var(--color-status-won)]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--color-status-won)]/15">
              <Check className="h-4 w-4 text-[color:var(--color-status-won)]" />
            </div>
            <div>
              <div className="text-sm font-bold">Gmail connected</div>
              <div className="text-xs text-[color:var(--color-foreground-dim)]">
                Sending as <span className="font-mono">{status.emailAddress ?? "your Gmail"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={disconnect}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-border-strong)] px-3 py-2 text-xs font-semibold text-[color:var(--color-foreground-dim)] transition-colors hover:text-[color:var(--color-quality-none)] disabled:opacity-50"
          >
            <Unplug className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--color-surface-2)]">
              <Mail className="h-4 w-4 text-[color:var(--color-foreground-dim)]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">Send from your own Gmail</div>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-foreground-dim)]">
                Connect once and outreach goes out from your inbox — best deliverability,
                replies land where you already work. We only request <strong>send</strong> permission;
                we never read your mail.
              </p>
              <a
                href="/api/auth/google/start"
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border-strong)] bg-background px-4 py-2 text-sm font-bold transition-colors hover:border-[color:var(--color-accent)]"
              >
                <GoogleG className="h-4 w-4" />
                Connect Gmail
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
