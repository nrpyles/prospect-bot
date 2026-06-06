"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Send, Check, Loader2, AlertCircle, Mail } from "lucide-react";

type GmailStatus = {
  configured: boolean;
  connected: boolean;
  emailAddress: string | null;
};

export function SendViaGmailButton({
  prospectId,
  to,
  subject,
  body,
  disabled,
  size = "md",
  onSent,
}: {
  prospectId: string;
  to?: string | null;
  subject: string;
  body: string;
  disabled?: boolean;
  size?: "sm" | "md";
  onSent?: (info: { to: string }) => void;
}) {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch("/api/gmail/status");
        const data = res.ok ? await res.json() : { configured: false, connected: false, emailAddress: null };
        if (alive) setStatus(data);
      } catch {
        if (alive) setStatus({ configured: false, connected: false, emailAddress: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function send() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId, to: to || undefined, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Send failed");
        return;
      }
      setSent(true);
      onSent?.({ to: data.to });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  const padding = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  // Still loading status
  if (status === null) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] font-bold text-[color:var(--color-foreground-dim)] opacity-60 ${padding}`}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Gmail
      </button>
    );
  }

  // Not configured on server, or not connected — link to settings
  if (!status.configured || !status.connected) {
    return (
      <Link
        href="/app/settings"
        className={`inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] font-bold text-[color:var(--color-foreground-dim)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] ${padding}`}
        title={status.configured ? "Connect Gmail in Settings" : "Gmail sending not set up yet"}
      >
        <Mail className="h-3.5 w-3.5" />
        Connect Gmail to send
      </Link>
    );
  }

  if (sent) {
    return (
      <span className={`inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-status-won)]/15 font-bold text-[color:var(--color-status-won)] ${padding}`}>
        <Check className="h-3.5 w-3.5" />
        Sent
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={send}
        disabled={sending || disabled || !(to || undefined)}
        className={`inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)] disabled:opacity-50 ${padding}`}
        title={!to ? "Find the prospect's email first" : `Send from ${status.emailAddress ?? "your Gmail"}`}
      >
        {sending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-3.5 w-3.5" />
            Send via Gmail
          </>
        )}
      </button>
      {error && (
        <span className="inline-flex items-center gap-1 text-[11px] text-[color:var(--color-quality-none)]">
          <AlertCircle className="h-3 w-3" />
          {error}
        </span>
      )}
      {!to && !error && (
        <span className="text-[11px] text-[color:var(--color-foreground-muted)]">
          No email on file — find it first.
        </span>
      )}
    </div>
  );
}
