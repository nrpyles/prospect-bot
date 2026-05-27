"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, RefreshCw, Sparkles } from "lucide-react";
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
}: {
  initialProspects: Prospect[];
  orgId: string;
  userFirstName?: string | null;
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
    <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8">
      {/* Greeting */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)] pulse-soft" />
            <p className="eyebrow">TODAY · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }).toUpperCase()}</p>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            {userFirstName ? `Hey ${userFirstName}` : "Hey there"} — let&apos;s close some deals.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFindOpen(true)}
            className="group inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-5 py-2.5 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)] glow-accent"
          >
            <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
            Find prospects
          </button>
          <button
            disabled
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-foreground-dim)] opacity-60"
            title="Manual add — coming next"
          >
            <Plus className="h-4 w-4" />
            Add manually
          </button>
          <button
            onClick={() => setProspects(initialProspects)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEmpty ? (
        <EmptyState onFindProspects={() => setFindOpen(true)} />
      ) : (
        <>
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
