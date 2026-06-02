"use client";

import { Star } from "lucide-react";
import type { Prospect } from "@/lib/mock-prospects";
import { QUALITY_COLORS, STATUS_COLORS } from "@/lib/pipeline";

export function ListView({
  prospects,
  onProspectClick,
}: {
  prospects: Prospect[];
  onProspectClick: (p: Prospect) => void;
}) {
  if (prospects.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-12 text-center text-sm text-[color:var(--color-foreground-muted)]">
        No prospects match your filters.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-2 lg:hidden">
        {prospects.map((p) => (
          <button
            key={p.id}
            onClick={() => onProspectClick(p)}
            className="flex w-full items-start justify-between gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-left transition-colors hover:border-[color:var(--color-accent-ring)]"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{p.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
                >
                  {p.industry}
                </span>
                <span className="text-[11px] text-[color:var(--color-foreground-dim)]">
                  {p.city}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2.5 text-[11px]">
                <span
                  className="rounded px-1.5 py-0.5 font-bold uppercase tracking-wide"
                  style={{
                    background: `color-mix(in srgb, ${STATUS_COLORS[p.status]} 15%, transparent)`,
                    color: STATUS_COLORS[p.status],
                  }}
                >
                  {p.status}
                </span>
                <span style={{ color: QUALITY_COLORS[p.quality] }} className="font-bold uppercase tracking-wide">
                  {p.quality}
                </span>
              </div>
            </div>
            {p.rating && (
              <div className="mono-stat flex flex-shrink-0 items-center gap-0.5 text-xs text-[color:var(--color-status-followup)]">
                <Star className="h-3 w-3 fill-current" />
                {p.rating}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] lg:block">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.7fr] gap-4 border-b border-[color:var(--color-border)] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-foreground-muted)]">
          <div>Business</div>
          <div>Industry</div>
          <div>City</div>
          <div>Status</div>
          <div>Quality</div>
          <div className="text-right">Rating</div>
        </div>
        {prospects.map((p) => (
          <button
            key={p.id}
            onClick={() => onProspectClick(p)}
            className="grid w-full grid-cols-[2fr_1fr_1fr_1fr_1fr_0.7fr] items-center gap-4 border-b border-[color:#141418] px-5 py-3 text-left text-sm transition-colors hover:bg-[color:var(--color-surface-2)] last:border-b-0"
          >
            <div className="font-semibold">{p.name}</div>
            <div>
              <span
                className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
              >
                {p.industry}
              </span>
            </div>
            <div className="text-[color:var(--color-foreground-dim)]">{p.city}</div>
            <div>
              <span
                className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  background: `color-mix(in srgb, ${STATUS_COLORS[p.status]} 15%, transparent)`,
                  color: STATUS_COLORS[p.status],
                }}
              >
                {p.status}
              </span>
            </div>
            <div
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: QUALITY_COLORS[p.quality] }}
            >
              {p.quality}
            </div>
            <div className="mono-stat text-right text-[color:var(--color-status-followup)]">
              {p.rating ?? "—"}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
