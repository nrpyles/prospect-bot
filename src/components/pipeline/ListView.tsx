"use client";

import type { Prospect } from "@/lib/mock-prospects";
import { QUALITY_COLORS, STATUS_COLORS } from "@/lib/pipeline";

export function ListView({
  prospects,
  onProspectClick,
}: {
  prospects: Prospect[];
  onProspectClick: (p: Prospect) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.7fr] gap-4 border-b border-[color:var(--color-border)] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-foreground-muted)]">
        <div>Business</div>
        <div>Industry</div>
        <div>City</div>
        <div>Status</div>
        <div>Quality</div>
        <div className="text-right">Rating</div>
      </div>
      {prospects.length === 0 ? (
        <div className="p-12 text-center text-sm text-[color:var(--color-foreground-muted)]">
          No prospects match your filters.
        </div>
      ) : (
        prospects.map((p) => (
          <button
            key={p.id}
            onClick={() => onProspectClick(p)}
            className="grid w-full grid-cols-[2fr_1fr_1fr_1fr_1fr_0.7fr] items-center gap-4 border-b border-[color:#141418] px-5 py-3 text-left text-sm transition-colors hover:bg-[color:var(--color-surface-2)] last:border-b-0"
          >
            <div className="font-semibold">{p.name}</div>
            <div>
              <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
                {p.industry}
              </span>
            </div>
            <div className="text-[color:var(--color-foreground-dim)]">{p.city}</div>
            <div>
              <span
                className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: `color-mix(in srgb, ${STATUS_COLORS[p.status]} 15%, transparent)`, color: STATUS_COLORS[p.status] }}
              >
                {p.status}
              </span>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: QUALITY_COLORS[p.quality] }}>
              {p.quality}
            </div>
            <div className="mono-stat text-right text-[color:var(--color-status-followup)]">
              {p.rating ?? "—"}
            </div>
          </button>
        ))
      )}
    </div>
  );
}
