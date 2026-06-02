"use client";

import { Search, ChevronDown } from "lucide-react";

export type FilterState = {
  search: string;
  industry: string;
  city: string;
  view: "pipeline" | "list" | "stats";
};

export function Filters({
  state,
  industries,
  cities,
  onChange,
}: {
  state: FilterState;
  industries: string[];
  cities: string[];
  onChange: (next: Partial<FilterState>) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {/* Search — full width on mobile */}
      <div className="relative flex-1 sm:min-w-[260px]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-foreground-muted)]" />
        <input
          type="text"
          placeholder="Search…"
          value={state.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="h-11 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] pl-10 pr-4 text-sm text-foreground placeholder:text-[color:var(--color-foreground-muted)] outline-none transition-colors focus:border-[color:var(--color-accent-ring)] focus:bg-background"
        />
      </div>

      {/* Dropdowns — side-by-side on mobile */}
      <div className="flex gap-2 sm:contents">
        <SelectChip
          value={state.industry}
          label="industry"
          options={industries}
          onChange={(v) => onChange({ industry: v })}
        />
        <SelectChip
          value={state.city}
          label="city"
          options={cities}
          onChange={(v) => onChange({ city: v })}
        />
      </div>

      {/* View toggle — full width on mobile, right-aligned on desktop */}
      <div className="flex items-center gap-1 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-1 sm:ml-auto">
        {(["pipeline", "list", "stats"] as const).map((v) => (
          <button
            key={v}
            onClick={() => onChange({ view: v })}
            className={`mono-tag flex-1 rounded-lg px-3 py-1.5 transition-colors sm:flex-initial ${
              state.view === v
                ? "bg-[color:var(--color-accent)] text-black"
                : "text-[color:var(--color-foreground-dim)] hover:text-foreground"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectChip({
  value,
  label,
  options,
  onChange,
}: {
  value: string;
  label: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex-1 sm:flex-initial">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] pl-3.5 pr-10 text-sm font-semibold text-foreground outline-none transition-colors focus:border-[color:var(--color-accent-ring)] sm:w-auto"
      >
        <option value="All">All {label}{label.endsWith("s") ? "" : "s"}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-foreground-muted)]" />
    </div>
  );
}
