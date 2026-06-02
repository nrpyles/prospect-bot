"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Sparkles, Layers, ArrowRight } from "lucide-react";
import type { Prospect } from "@/lib/mock-prospects";
import type { Status } from "@/lib/pipeline";
import { Filters, type FilterState } from "@/components/pipeline/Filters";
import { StatsBar } from "@/components/pipeline/StatsBar";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { ListView } from "@/components/pipeline/ListView";
import { StatsView } from "@/components/pipeline/StatsView";
import { ProspectDrawer } from "@/components/pipeline/ProspectDrawer";
import { FindProspectsModal } from "@/components/pipeline/FindProspectsModal";
import { TodaysPlaybook } from "@/components/pipeline/TodaysPlaybook";
import { EmptyState } from "@/components/pipeline/EmptyState";
import { BulkDraftDialog } from "@/components/pipeline/BulkDraftDialog";
import {
  saveProspectAction,
  deleteProspectAction,
  updateStatusAction,
} from "./actions";

export function PipelineClient({
  initialProspects,
  orgId: _orgId,
  userFirstName,
  dueSequenceCount = 0,
}: {
  initialProspects: Prospect[];
  orgId: string;
  userFirstName?: string | null;
  dueSequenceCount?: number;
}) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [findOpen, setFindOpen] = useState(false);
  const [bulkTargets, setBulkTargets] = useState<Prospect[] | null>(null);
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterState>({
    search: "",
    industry: "All",
    city: "All",
    view: "pipeline",
  });

  // On first mount, switch to list view on phone-sized screens — the Kanban
  // has 6 columns that stack into a very long single-column scroll on mobile.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 768px)").matches) {
      setFilter((f) => (f.view === "pipeline" ? { ...f, view: "list" } : f));
    }
  }, []);

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (filter.industry !== "All" && p.industry !== filter.industry) return false;
      if (filter.city !== "All" && p.city !== filter.city) return false;
      if (filter.search) {
        const s = filter.search.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(s) ||
          (p.ownerName ?? "").toLowerCase().includes(s);
        if (!matches) return false;
      }
      return true;
    });
  }, [prospects, filter]);

  const industries = useMemo(
    () => [...new Set(prospects.map((p) => p.industry))].sort(),
    [prospects],
  );
  const cities = useMemo(
    () => [...new Set(prospects.map((p) => p.city))].sort(),
    [prospects],
  );

  function handleStatusChange(prospectId: string, newStatus: Status) {
    setProspects((arr) =>
      arr.map((p) => (p.id === prospectId ? { ...p, status: newStatus } : p)),
    );
    startTransition(async () => {
      await updateStatusAction(prospectId, newStatus);
    });
  }

  function handleSave(updated: Prospect) {
    setProspects((arr) => arr.map((p) => (p.id === updated.id ? updated : p)));
    setSelected(updated);
    startTransition(async () => {
      await saveProspectAction(updated.id, updated);
    });
  }

  function handleDelete(id: string) {
    setProspects((arr) => arr.filter((p) => p.id !== id));
    setSelected(null);
    startTransition(async () => {
      await deleteProspectAction(id);
    });
  }

  function focusOnStatuses(statuses: string[]) {
    // Clear other filters and scroll to pipeline. (For now, just clear filter.search.)
    setFilter((f) => ({ ...f, search: "", industry: "All", city: "All", view: "list" }));
    // TODO: also visually scroll-to / highlight matching cards
    document.getElementById("pipeline-view")?.scrollIntoView({ behavior: "smooth", block: "start" });
    void statuses;
  }

  function startBulkDraft(statuses: string[]) {
    const targets = prospects.filter((p) => statuses.includes(p.status));
    if (targets.length === 0) return;
    setBulkTargets(targets);
  }

  const isEmpty = prospects.length === 0;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8 lg:py-8">
      {/* Greeting */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)] pulse-soft" />
            <p className="eyebrow truncate">
              TODAY · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }).toUpperCase()}
            </p>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            {userFirstName ? `Hey ${userFirstName}` : "Hey there"} —{" "}
            <span className="block sm:inline">let&apos;s close some deals.</span>
          </h1>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            onClick={() => setFindOpen(true)}
            className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-4 py-2.5 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)] glow-accent sm:flex-initial sm:px-5"
          >
            <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
            <span className="whitespace-nowrap">Find prospects</span>
          </button>
          <button
            disabled
            className="hidden items-center gap-2 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-foreground-dim)] opacity-60 md:inline-flex"
            title="Manual add — coming next"
          >
            <Plus className="h-4 w-4" />
            Add manually
          </button>
          <button
            onClick={() => setProspects(initialProspects)}
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEmpty ? (
        <EmptyState onFindProspects={() => setFindOpen(true)} />
      ) : (
        <>
          {/* Sequence due banner — only shows when sequence touches are due */}
          {dueSequenceCount > 0 && (
            <Link
              href="/app/sequences/due"
              className="group mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] p-4 transition-all hover:-translate-y-0.5 lg:p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-accent)] text-black">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[color:var(--color-accent)] sm:text-base">
                    {dueSequenceCount === 1
                      ? "1 sequence touch is due now"
                      : `${dueSequenceCount} sequence touches are due now`}
                  </div>
                  <div className="text-xs text-[color:var(--color-foreground-dim)]">
                    Draft, copy, send, advance — knock them out in one pass.
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 flex-shrink-0 text-[color:var(--color-accent)] transition-transform group-hover:translate-x-1" />
            </Link>
          )}

          {/* Today's playbook */}
          <section className="mb-10">
            <TodaysPlaybook
              prospects={prospects}
              onFocusStatus={focusOnStatuses}
              onBulkDraft={startBulkDraft}
            />
          </section>

          {/* Stats */}
          <section className="mb-8">
            <StatsBar prospects={prospects} />
          </section>

          {/* Filters */}
          <section className="mb-5">
            <Filters
              state={filter}
              industries={industries}
              cities={cities}
              onChange={(next) => setFilter((f) => ({ ...f, ...next }))}
            />
          </section>

          {/* View */}
          <section id="pipeline-view">
            {filter.view === "pipeline" && (
              <PipelineBoard
                prospects={filtered}
                onProspectClick={setSelected}
                onStatusChange={handleStatusChange}
              />
            )}
            {filter.view === "list" && (
              <ListView prospects={filtered} onProspectClick={setSelected} />
            )}
            {filter.view === "stats" && <StatsView prospects={filtered} />}
          </section>
        </>
      )}

      <ProspectDrawer
        prospect={selected}
        onClose={() => setSelected(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <FindProspectsModal
        open={findOpen}
        onClose={() => setFindOpen(false)}
        existingNames={prospects.map((p) => p.name)}
        onComplete={(found) => {
          setProspects((arr) => [...found, ...arr]);
        }}
      />

      <BulkDraftDialog
        open={bulkTargets !== null}
        prospects={bulkTargets ?? []}
        onClose={() => setBulkTargets(null)}
        onAutoAdvance={async (prospectId) => {
          // Auto-advance to "Email Sent" when user marks the bulk draft as sent
          setProspects((arr) =>
            arr.map((p) =>
              p.id === prospectId
                ? { ...p, status: "Email Sent", lastContactedAt: new Date().toISOString().slice(0, 10) }
                : p,
            ),
          );
          await updateStatusAction(prospectId, "Email Sent");
        }}
      />
    </div>
  );
}
