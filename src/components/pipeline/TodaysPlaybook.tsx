"use client";

import { useMemo } from "react";
import { Mail, Clock, Phone, FileCheck, Sparkles, ArrowRight } from "lucide-react";
import type { Prospect } from "@/lib/mock-prospects";

type ActionCard = {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  title: string;
  hint: string;
  ctaLabel: string;
  accent: string;
  filterStatus: string[];
};

function daysSince(iso?: string): number {
  if (!iso) return Infinity;
  const then = new Date(iso).getTime();
  if (isNaN(then)) return Infinity;
  return (Date.now() - then) / (1000 * 60 * 60 * 24);
}

export function TodaysPlaybook({
  prospects,
  onFocusStatus,
  onBulkDraft,
}: {
  prospects: Prospect[];
  onFocusStatus: (statuses: string[]) => void;
  onBulkDraft: (statuses: string[]) => void;
}) {
  const cards: ActionCard[] = useMemo(() => {
    const newLeads = prospects.filter((p) => p.status === "New Lead");

    const overdueFollowups = prospects.filter(
      (p) =>
        ["Email Sent", "DM Sent", "Text Sent", "Called", "Follow Up 1"].includes(p.status) &&
        daysSince(p.lastContactedAt) >= 3,
    );

    const warmNeedingAttention = prospects.filter(
      (p) => p.status === "Interested" || p.status === "Call Scheduled",
    );

    const proposalsAwaiting = prospects.filter(
      (p) => p.status === "Proposal Sent" && daysSince(p.lastContactedAt) >= 5,
    );

    return [
      {
        key: "new",
        icon: Mail,
        count: newLeads.length,
        title: "New leads need a first email",
        hint:
          newLeads.length > 0
            ? "Claude can draft all of these in one shot — personalized to each website."
            : "No new leads — run a search to find more.",
        ctaLabel: "Draft all",
        accent: "var(--color-status-new)",
        filterStatus: ["New Lead"],
      },
      {
        key: "overdue",
        icon: Clock,
        count: overdueFollowups.length,
        title: "Follow-ups overdue",
        hint:
          overdueFollowups.length > 0
            ? "Last touched 3+ days ago. Time for a check-in."
            : "Everyone's on schedule.",
        ctaLabel: "Send follow-ups",
        accent: "var(--color-status-followup)",
        filterStatus: ["Email Sent", "DM Sent", "Text Sent", "Called", "Follow Up 1"],
      },
      {
        key: "warm",
        icon: Phone,
        count: warmNeedingAttention.length,
        title: "Warm leads waiting",
        hint:
          warmNeedingAttention.length > 0
            ? "Interested or call scheduled. Don't let them cool off."
            : "No warm leads yet — keep working the funnel.",
        ctaLabel: "Review",
        accent: "var(--color-status-warm)",
        filterStatus: ["Interested", "Call Scheduled"],
      },
      {
        key: "proposals",
        icon: FileCheck,
        count: proposalsAwaiting.length,
        title: "Proposals to chase",
        hint:
          proposalsAwaiting.length > 0
            ? "Sent 5+ days ago with no movement. Time to nudge."
            : "No stale proposals.",
        ctaLabel: "Chase",
        accent: "var(--color-status-closing)",
        filterStatus: ["Proposal Sent"],
      },
    ];
  }, [prospects]);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="group relative flex flex-col rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 card-lift hover:border-[color:var(--color-accent-ring)]"
        >
          <div className="flex items-start justify-between">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: `color-mix(in srgb, ${card.accent} 15%, transparent)` }}
            >
              <card.icon className="h-4 w-4" style={{ color: card.accent }} />
            </div>
            <div className="mono-stat text-3xl leading-none" style={{ color: card.accent }}>
              {card.count}
            </div>
          </div>

          <div className="mt-4 text-base font-bold tracking-tight">{card.title}</div>
          <p className="mt-1.5 text-xs text-[color:var(--color-foreground-dim)] leading-relaxed">{card.hint}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {card.count > 0 ? (
              <>
                {card.key === "new" && (
                  <button
                    onClick={() => onBulkDraft(card.filterStatus)}
                    className="group/btn inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--color-accent)] px-3 py-1.5 text-xs font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)]"
                  >
                    <Sparkles className="h-3 w-3" />
                    {card.ctaLabel}
                  </button>
                )}
                <button
                  onClick={() => onFocusStatus(card.filterStatus)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-border-strong)] px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-[color:var(--color-surface-2)] ${
                    card.key === "new" ? "" : ""
                  }`}
                >
                  {card.key === "new" ? "View" : card.ctaLabel}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </>
            ) : (
              <span className="mono-tag text-[color:var(--color-foreground-muted)]">— ALL CLEAR</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
