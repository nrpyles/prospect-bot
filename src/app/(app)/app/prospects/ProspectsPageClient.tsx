"use client";

import { useMemo, useState, useTransition } from "react";
import type { Prospect } from "@/lib/mock-prospects";
import { ListView } from "@/components/pipeline/ListView";
import { Filters, type FilterState } from "@/components/pipeline/Filters";
import { ProspectDrawer } from "@/components/pipeline/ProspectDrawer";
import {
  saveProspectAction,
  deleteProspectAction,
} from "../actions";

export function ProspectsPageClient({ initialProspects }: { initialProspects: Prospect[] }) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterState>({
    search: "",
    industry: "All",
    city: "All",
    view: "list",
  });

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (filter.industry !== "All" && p.industry !== filter.industry) return false;
      if (filter.city !== "All" && p.city !== filter.city) return false;
      if (filter.search) {
        const s = filter.search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(s) &&
          !(p.ownerName ?? "").toLowerCase().includes(s)
        )
          return false;
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

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 lg:px-8 lg:py-12">
      <div className="mb-8">
        <p className="eyebrow mb-2">PROSPECTS</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          All {prospects.length} {prospects.length === 1 ? "prospect" : "prospects"}.
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-foreground-dim)]">
          Full list view across every stage. Click a row to open the detail drawer.
        </p>
      </div>

      <div className="mb-5">
        <Filters
          state={filter}
          industries={industries}
          cities={cities}
          onChange={(next) => setFilter((f) => ({ ...f, ...next }))}
        />
      </div>

      <ListView prospects={filtered} onProspectClick={setSelected} />

      <ProspectDrawer
        prospect={selected}
        onClose={() => setSelected(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
