"use client";

import { TrendingUp, Users, Target, MessageCircle, Heart, FileText, Trophy, DollarSign } from "lucide-react";
import type { Prospect } from "@/lib/mock-prospects";

function fmtMoney(cents: number) {
  return "$" + (cents / 100).toLocaleString();
}

export function StatsBar({ prospects }: { prospects: Prospect[] }) {
  const total = prospects.length;
  const newLeads = prospects.filter((p) => p.status === "New Lead").length;
  const contacted = prospects.filter((p) =>
    ["Email Sent", "DM Sent", "Text Sent", "Called", "Follow Up 1", "Follow Up 2"].includes(p.status),
  ).length;
  const interested = prospects.filter((p) =>
    ["Interested", "Call Scheduled"].includes(p.status),
  ).length;
  const proposals = prospects.filter((p) => p.status === "Proposal Sent").length;
  const won = prospects.filter((p) => p.status === "Closed Won").length;
  const revenue = prospects
    .filter((p) => p.status === "Closed Won")
    .reduce((s, p) => s + (p.valueCents ?? 0), 0);
  const pipeline = prospects
    .filter((p) => ["Interested", "Call Scheduled", "Proposal Sent"].includes(p.status))
    .reduce((s, p) => s + (p.valueCents ?? 0), 0);

  const stats = [
    { icon: Users, label: "TOTAL", value: String(total), color: "var(--color-foreground)" },
    { icon: Target, label: "NEW", value: String(newLeads), color: "var(--color-status-new)" },
    { icon: MessageCircle, label: "CONTACTED", value: String(contacted), color: "var(--color-status-outreach)" },
    { icon: Heart, label: "WARM", value: String(interested), color: "var(--color-status-warm)" },
    { icon: FileText, label: "PROPOSALS", value: String(proposals), color: "var(--color-status-closing)" },
    { icon: Trophy, label: "WON", value: String(won), color: "var(--color-status-won)" },
    { icon: DollarSign, label: "REVENUE", value: fmtMoney(revenue), color: "var(--color-accent)" },
    { icon: TrendingUp, label: "PIPELINE", value: fmtMoney(pipeline), color: "var(--color-status-followup)" },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-border)] md:grid-cols-4 lg:grid-cols-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="group relative bg-background p-4 transition-colors hover:bg-[color:var(--color-surface)]"
        >
          <s.icon
            className="absolute right-3 top-3 h-3.5 w-3.5 opacity-25 transition-opacity group-hover:opacity-60"
            style={{ color: s.color }}
          />
          <div className="mono-stat text-2xl leading-none" style={{ color: s.color }}>
            {s.value}
          </div>
          <div className="eyebrow mt-2 text-[10px]">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
