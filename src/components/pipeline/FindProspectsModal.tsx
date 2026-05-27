"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Prospect } from "@/lib/mock-prospects";
import { INDUSTRIES } from "@/lib/pipeline";

type RunResult = {
  prospects: Prospect[];
  stats: {
    citiesSearched: number;
    industriesSearched: number;
    totalFound: number;
    totalAdded: number;
    totalSkippedDup: number;
    totalSkippedGood: number;
  };
  errors: string[];
  usingSharedKey: boolean;
};

const DEFAULT_CITIES = ["Plano, TX", "Frisco, TX", "McKinney, TX"];
const DEFAULT_INDUSTRIES = ["Roofing", "HVAC", "Pool Builder"] as const;

export function FindProspectsModal({
  open,
  onClose,
  existingNames,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  existingNames: string[];
  onComplete: (newProspects: Prospect[]) => void;
}) {
  const [cities, setCities] = useState<string[]>(DEFAULT_CITIES);
  const [cityInput, setCityInput] = useState("");
  const [industries, setIndustries] = useState<string[]>([...DEFAULT_INDUSTRIES]);
  const [apiKey, setApiKey] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Persist API key locally (will move to DB-backed settings later)
  useEffect(() => {
    if (open) {
      const stored = typeof window !== "undefined" ? localStorage.getItem("fc_gmaps_key") : null;
      if (stored) setApiKey(stored);
    }
  }, [open]);

  useEffect(() => {
    if (apiKey && typeof window !== "undefined") {
      localStorage.setItem("fc_gmaps_key", apiKey);
    }
  }, [apiKey]);

  function addCity() {
    const trimmed = cityInput.trim();
    if (!trimmed) return;
    if (!cities.includes(trimmed)) setCities((c) => [...c, trimmed]);
    setCityInput("");
  }

  function removeCity(c: string) {
    setCities((cs) => cs.filter((x) => x !== c));
  }

  function toggleIndustry(i: string) {
    setIndustries((is) => (is.includes(i) ? is.filter((x) => x !== i) : [...is, i]));
  }

  async function runSearch() {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/searches/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cities,
          industries,
          apiKey: apiKey || undefined,
          existingNames,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed.");
        return;
      }
      setResult(data as RunResult);
      onComplete(data.prospects);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  }

  function handleClose() {
    if (isRunning) return;
    setResult(null);
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div
        onClick={handleClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16 sm:p-8">
        <div className="w-full max-w-2xl rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[color:var(--color-border)] p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[color:var(--color-accent-soft)] p-2.5">
                <Sparkles className="h-5 w-5 text-[color:var(--color-accent)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Find prospects</h2>
                <p className="mt-0.5 text-sm text-[color:var(--color-foreground-dim)]">
                  Scan Google Maps + score websites in one shot.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isRunning}
              className="rounded-lg p-2 text-[color:var(--color-foreground-dim)] transition-colors hover:bg-[color:var(--color-surface-2)] hover:text-foreground disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          {result ? (
            <ResultsPanel result={result} onClose={handleClose} />
          ) : (
            <div className="space-y-6 p-6">
              {/* Cities */}
              <section>
                <label className="eyebrow mb-2 block text-[10px]">
                  CITIES
                </label>
                <div className="flex flex-wrap gap-2 rounded-xl border border-[color:var(--color-border)] bg-background p-2.5">
                  {cities.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--color-surface-2)] px-2.5 py-1 text-xs font-semibold"
                    >
                      {c}
                      <button
                        onClick={() => removeCity(c)}
                        className="text-[color:var(--color-foreground-muted)] transition-colors hover:text-[color:var(--color-quality-none)]"
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addCity();
                      }
                    }}
                    onBlur={addCity}
                    placeholder="Add a city (e.g. Plano, TX)…"
                    className="min-w-[180px] flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--color-foreground-muted)]"
                  />
                </div>
              </section>

              {/* Industries */}
              <section>
                <label className="eyebrow mb-2 block text-[10px]">
                  INDUSTRIES — {industries.length} SELECTED
                </label>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                  {INDUSTRIES.filter((i) => i !== "Other").map((i) => {
                    const checked = industries.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleIndustry(i)}
                        className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                          checked
                            ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                            : "border-[color:var(--color-border)] bg-background text-[color:var(--color-foreground-dim)] hover:border-[color:var(--color-border-strong)] hover:text-foreground"
                        }`}
                      >
                        {i}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* API key */}
              <section>
                <label className="eyebrow mb-2 block text-[10px]">
                  GOOGLE MAPS API KEY (OPTIONAL)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza... (paste your own key for unlimited searches)"
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--color-accent)]"
                />
                <p className="mt-2 text-xs text-[color:var(--color-foreground-muted)]">
                  Leave blank to use FunnelCloser's shared key (free trial, capped at 25 prospects per search).
                  Bring your own key from{" "}
                  <a
                    href="https://console.cloud.google.com/google/maps-apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[color:var(--color-accent)] hover:underline"
                  >
                    Google Cloud Console
                  </a>{" "}
                  to remove the cap (each Google account gets $200/mo of free usage).
                </p>
              </section>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-[color:var(--color-quality-none)]/30 bg-[color:var(--color-quality-none)]/10 p-3 text-sm text-[color:var(--color-quality-none)]">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {!result && (
            <div className="flex items-center justify-between border-t border-[color:var(--color-border)] p-4">
              <div className="text-xs text-[color:var(--color-foreground-muted)]">
                {cities.length} cities × {industries.length} industries ={" "}
                <span className="mono-stat text-foreground">{cities.length * industries.length}</span> queries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  disabled={isRunning}
                  className="rounded-xl border border-[color:var(--color-border-strong)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[color:var(--color-surface-2)] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={runSearch}
                  disabled={isRunning || cities.length === 0 || industries.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-5 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)] disabled:opacity-50"
                >
                  {isRunning ? (
                    <>
                      <span className="h-3 w-3 animate-pulse rounded-full bg-black/40" />
                      Searching…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Start search
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ResultsPanel({ result, onClose }: { result: RunResult; onClose: () => void }) {
  return (
    <div className="p-6">
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-[color:var(--color-status-won)]/30 bg-[color:var(--color-status-won)]/10 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--color-status-won)]" />
        <div>
          <div className="font-bold text-[color:var(--color-status-won)]">
            Added {result.stats.totalAdded} new prospect{result.stats.totalAdded === 1 ? "" : "s"}
          </div>
          <div className="mt-1 text-xs text-[color:var(--color-foreground-dim)]">
            {result.usingSharedKey ? "Used FunnelCloser shared key (free trial)." : "Used your own API key — no caps."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-border)] md:grid-cols-4">
        <Stat label="FOUND" value={result.stats.totalFound} />
        <Stat label="ADDED" value={result.stats.totalAdded} color="var(--color-accent)" />
        <Stat label="DUPLICATES" value={result.stats.totalSkippedDup} />
        <Stat label="GOOD SITES" value={result.stats.totalSkippedGood} />
      </div>

      {result.errors.length > 0 && (
        <div className="mt-4 rounded-xl border border-[color:var(--color-quality-terrible)]/30 bg-[color:var(--color-quality-terrible)]/10 p-3 text-xs text-[color:var(--color-quality-terrible)]">
          <div className="mb-1 font-bold uppercase tracking-wide">Errors:</div>
          <ul className="space-y-1">
            {result.errors.map((e, i) => (
              <li key={i}>· {e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-xl bg-[color:var(--color-accent)] px-5 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)]"
        >
          View pipeline →
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-background p-4">
      <div className="mono-stat text-2xl" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="eyebrow mt-1 text-[10px]">{label}</div>
    </div>
  );
}
