"use client";

import type { Prospect } from "@/lib/mock-prospects";
import { QUALITIES, QUALITY_COLORS } from "@/lib/pipeline";

function fmt(cents: number) {
  return "$" + (cents / 100).toLocaleString();
}

export function StatsView({ prospects }: { prospects: Prospect[] }) {
  const total = prospects.length;
  const won = prospects.filter((p) => p.status === "Closed Won").length;
  const closeRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0";

  const byIndustry = Object.entries(
    prospects.reduce<Record<string, number>>((acc, p) => {
      acc[p.industry] = (acc[p.industry] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const byCity = Object.entries(
    prospects.reduce<Record<string, number>>((acc, p) => {
      acc[p.city] = (acc[p.city] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const byQuality = QUALITIES.map((q) => ({
    quality: q,
    count: prospects.filter((p) => p.quality === q).length,
  }));

  const revenue = prospects
    .filter((p) => p.status === "Closed Won")
    .reduce((s, p) => s + (p.valueCents ?? 0), 0);

  const pipeline = prospects
    .filter((p) => ["Interested", "Call Scheduled", "Proposal Sent"].includes(p.status))
    .reduce((s, p) => s + (p.valueCents ?? 0), 0);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <StatsCard title="BY INDUSTRY">
        <BarList
          items={byIndustry.map(([label, n]) => ({ label, n, pct: total > 0 ? (n / total) * 100 : 0 }))}
          gradient="linear-gradient(90deg, var(--color-accent), #f97316)"
        />
      </StatsCard>

      <StatsCard title="BY CITY">
        <BarList
          items={byCity.map(([label, n]) => ({ label, n, pct: total > 0 ? (n / total) * 100 : 0 }))}
          gradient="linear-gradient(90deg, var(--color-status-new), #8b5cf6)"
        />
      </StatsCard>

      <StatsCard title="WEBSITE QUALITY">
        <BarList
          items={byQuality.map((q) => ({
            label: q.quality,
            n: q.count,
            pct: total > 0 ? (q.count / total) * 100 : 0,
            color: QUALITY_COLORS[q.quality],
          }))}
        />
      </StatsCard>

      <StatsCard title="REVENUE">
        <div className="space-y-4">
          <BigStat label="CLOSED WON" value={fmt(revenue)} color="var(--color-accent)" />
          <BigStat label="PIPELINE" value={fmt(pipeline)} color="var(--color-status-followup)" />
          <BigStat label="CLOSE RATE" value={`${closeRate}%`} color="var(--color-status-won)" />
        </div>
      </StatsCard>
    </div>
  );
}

function StatsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
      <div className="eyebrow mb-5">{title}</div>
      {children}
    </div>
  );
}

function BarList({
  items,
  gradient,
}: {
  items: { label: string; n: number; pct: number; color?: string }[];
  gradient?: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-semibold" style={it.color ? { color: it.color } : undefined}>
              {it.label}
            </span>
            <span className="mono-stat text-xs text-[color:var(--color-foreground-muted)]">
              {it.n} · {it.pct.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--color-border)]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${it.pct}%`, background: it.color ?? gradient }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BigStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: `color-mix(in srgb, ${color} 25%, transparent)`, background: `color-mix(in srgb, ${color} 8%, transparent)` }}
    >
      <div className="eyebrow text-[10px]">{label}</div>
      <div className="mono-stat mt-1 text-3xl" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
