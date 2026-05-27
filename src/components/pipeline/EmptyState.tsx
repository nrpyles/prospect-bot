"use client";

import { Sparkles, Search, ArrowRight, Zap, Target, Mail } from "lucide-react";

export function EmptyState({
  onFindProspects,
  onTrySample,
}: {
  onFindProspects: () => void;
  onTrySample?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 lg:p-16">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-[400px] w-[600px] rounded-full opacity-[0.18] blur-[120px]"
        style={{ background: "radial-gradient(circle, #FF6B2C 0%, transparent 70%)" }}
      />

      <div className="relative max-w-2xl">
        <div className="mb-5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)] pulse-soft" />
          <p className="eyebrow">FIRST RUN</p>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Let&apos;s find your first 10 prospects.
        </h2>
        <p className="mt-4 text-base text-[color:var(--color-foreground-dim)] leading-relaxed md:text-lg">
          Tell FunnelCloser which cities and industries you want to close.
          We&apos;ll scan Google Maps, score every website we find, and only
          surface the businesses that actually need what you sell.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={onFindProspects}
            className="group inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)] glow-accent"
          >
            <Search className="h-4 w-4" />
            Find my first prospects
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          {onTrySample && (
            <button
              onClick={onTrySample}
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border-strong)] bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-[color:var(--color-surface-2)]"
            >
              Or try with sample data
            </button>
          )}
        </div>

        {/* 3-step preview */}
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: Target, step: "01", title: "Target", body: "Pick your cities + industries." },
            { icon: Search, step: "02", title: "Find", body: "We score every site for SSL, mobile, lead capture." },
            { icon: Sparkles, step: "03", title: "Close", body: "Claude drafts a custom email per prospect." },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-[color:var(--color-border)] bg-background p-4">
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-[color:var(--color-accent)]" />
                <div className="mono-tag text-[color:var(--color-foreground-muted)]">{s.step}</div>
              </div>
              <div className="mt-2 text-sm font-bold">{s.title}</div>
              <p className="mt-1 text-xs text-[color:var(--color-foreground-dim)]">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-xl border border-[color:var(--color-accent-ring)] bg-[color:var(--color-accent-soft)] p-4">
          <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--color-accent)]" />
          <div>
            <div className="text-sm font-bold text-foreground">First search is on us.</div>
            <div className="mt-1 text-xs text-[color:var(--color-foreground-dim)] leading-relaxed">
              Use our shared Google Maps key for your first 25 prospects.
              After that, paste your own key in Settings (free $200/mo credit from Google).
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[color:var(--color-border)] bg-background p-4">
          <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--color-foreground-dim)]" />
          <div>
            <div className="text-sm font-bold text-foreground">No spreadsheets, ever.</div>
            <div className="mt-1 text-xs text-[color:var(--color-foreground-dim)] leading-relaxed">
              Every prospect lives in your pipeline. Drag between stages, track
              follow-ups, draft AI emails — all in one place.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
