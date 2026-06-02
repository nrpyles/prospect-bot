"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Clock, Plus, Trash2, Sparkles, Save, Power, PowerOff, ChevronUp, ChevronDown } from "lucide-react";
import {
  updateSequenceAction,
  deleteSequenceAction,
  saveStepsAction,
} from "../actions";

type Step = {
  kind: "email" | "wait" | "task";
  subject?: string | null;
  body?: string | null;
  useAiDraft?: boolean | null;
  waitDays?: number | null;
};

export function SequenceEditorClient({
  id,
  initialName,
  initialDescription,
  initialActive,
  initialSteps,
}: {
  id: string;
  initialName: string;
  initialDescription: string;
  initialActive: boolean;
  initialSteps: Step[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isActive, setIsActive] = useState(initialActive);
  const [steps, setSteps] = useState<Step[]>(
    initialSteps.length > 0
      ? initialSteps
      : [
          { kind: "email", subject: "", body: "", useAiDraft: true, waitDays: null },
        ],
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function addEmail() {
    setSteps((s) => [...s, { kind: "email", subject: "", body: "", useAiDraft: true, waitDays: null }]);
  }
  function addWait() {
    setSteps((s) => [...s, { kind: "wait", waitDays: 3, subject: null, body: null, useAiDraft: false }]);
  }
  function removeAt(idx: number) {
    setSteps((s) => s.filter((_, i) => i !== idx));
  }
  function move(idx: number, dir: -1 | 1) {
    setSteps((s) => {
      const next = [...s];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return next;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }
  function updateStep(idx: number, patch: Partial<Step>) {
    setSteps((s) => s.map((st, i) => (i === idx ? { ...st, ...patch } : st)));
  }

  function save() {
    startTransition(async () => {
      await updateSequenceAction(id, {
        name: name.trim() || "Untitled",
        description: description.trim() || null,
        isActive,
      });
      await saveStepsAction(
        id,
        steps.map((s) => ({
          kind: s.kind as "email" | "wait",
          subject: s.subject ?? null,
          body: s.body ?? null,
          useAiDraft: s.useAiDraft ?? false,
          waitDays: s.kind === "wait" ? s.waitDays ?? 0 : null,
        })),
      );
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 1800);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${name}" sequence? All enrollments will be removed.`)) return;
    startTransition(async () => {
      await deleteSequenceAction(id);
      router.push("/app/sequences");
    });
  }

  const emailCount = steps.filter((s) => s.kind === "email").length;
  const totalDays = steps
    .filter((s) => s.kind === "wait")
    .reduce((sum, s) => sum + (s.waitDays ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
        <div className="flex items-start justify-between gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent text-2xl font-extrabold tracking-tight outline-none focus:border-b focus:border-[color:var(--color-accent)] md:text-3xl"
          />
          <button
            onClick={() => setIsActive((a) => !a)}
            className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              isActive
                ? "bg-[color:var(--color-status-won)]/15 text-[color:var(--color-status-won)] hover:bg-[color:var(--color-status-won)]/25"
                : "bg-[color:var(--color-surface-2)] text-[color:var(--color-foreground-muted)] hover:bg-[color:var(--color-surface-3)]"
            }`}
          >
            {isActive ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
            {isActive ? "Active" : "Draft"}
          </button>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this sequence for?"
          rows={2}
          className="mt-3 w-full resize-none bg-transparent text-sm text-[color:var(--color-foreground-dim)] outline-none placeholder:text-[color:var(--color-foreground-muted)]"
        />
        <div className="mt-4 flex items-center gap-4 text-xs text-[color:var(--color-foreground-dim)]">
          <span><span className="mono-stat text-foreground">{emailCount}</span> emails</span>
          <span><span className="mono-stat text-foreground">{totalDays}d</span> total</span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <h3 className="eyebrow">STEPS</h3>
        {steps.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] p-8 text-center text-sm text-[color:var(--color-foreground-dim)]">
            No steps yet — click <strong>Add email</strong> below to start.
          </div>
        )}
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="mono-stat text-xs text-[color:var(--color-foreground-muted)]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                {step.kind === "email" ? (
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    <Mail className="h-4 w-4 text-[color:var(--color-accent)]" />
                    Email
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    <Clock className="h-4 w-4 text-[color:var(--color-status-followup)]" />
                    Wait
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="rounded-md p-1 text-[color:var(--color-foreground-muted)] transition-colors hover:bg-[color:var(--color-surface-2)] hover:text-foreground disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === steps.length - 1}
                  className="rounded-md p-1 text-[color:var(--color-foreground-muted)] transition-colors hover:bg-[color:var(--color-surface-2)] hover:text-foreground disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => removeAt(idx)}
                  className="rounded-md p-1 text-[color:var(--color-foreground-muted)] transition-colors hover:bg-[color:var(--color-quality-none)]/10 hover:text-[color:var(--color-quality-none)]"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {step.kind === "email" ? (
              <div className="space-y-3">
                <label className="flex items-center gap-2 rounded-lg border border-[color:var(--color-accent-ring)] bg-[color:var(--color-accent-soft)] px-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={step.useAiDraft ?? false}
                    onChange={(e) => updateStep(idx, { useAiDraft: e.target.checked })}
                    className="h-4 w-4 accent-[color:var(--color-accent)]"
                  />
                  <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-accent)]" />
                  <span className="text-sm font-bold text-[color:var(--color-accent)]">
                    Let Claude personalize this email per prospect
                  </span>
                </label>
                <div>
                  <label className="eyebrow mb-1.5 block text-[10px]">
                    SUBJECT {step.useAiDraft && "(AI may override)"}
                  </label>
                  <input
                    type="text"
                    value={step.subject ?? ""}
                    onChange={(e) => updateStep(idx, { subject: e.target.value })}
                    placeholder={step.useAiDraft ? "Optional fallback — Claude writes one" : "noticed {{name}}'s site has no SSL"}
                    className="w-full rounded-xl border border-[color:var(--color-border)] bg-background px-3.5 py-2 text-sm outline-none focus:border-[color:var(--color-accent-ring)]"
                  />
                </div>
                <div>
                  <label className="eyebrow mb-1.5 block text-[10px]">
                    BODY {step.useAiDraft && "(AI may override)"}
                  </label>
                  <textarea
                    value={step.body ?? ""}
                    onChange={(e) => updateStep(idx, { body: e.target.value })}
                    rows={5}
                    placeholder={
                      step.useAiDraft
                        ? "Optional template. If filled, Claude uses it as a starting point."
                        : "Hey — just clicked through to {{website}} and..."
                    }
                    className="w-full resize-y rounded-xl border border-[color:var(--color-border)] bg-background px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent-ring)]"
                  />
                  <p className="mt-1.5 text-[11px] text-[color:var(--color-foreground-muted)]">
                    Variables: <code className="font-mono">{`{{name}}`}</code> ·{" "}
                    <code className="font-mono">{`{{industry}}`}</code> ·{" "}
                    <code className="font-mono">{`{{city}}`}</code> ·{" "}
                    <code className="font-mono">{`{{website}}`}</code>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="eyebrow mb-1.5 block text-[10px]">WAIT</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={step.waitDays ?? 0}
                    onChange={(e) => updateStep(idx, { waitDays: parseInt(e.target.value) || 0 })}
                    className="w-24 rounded-xl border border-[color:var(--color-border)] bg-background px-3.5 py-2 text-sm outline-none focus:border-[color:var(--color-accent-ring)]"
                  />
                  <span className="text-sm text-[color:var(--color-foreground-dim)]">
                    day{(step.waitDays ?? 0) === 1 ? "" : "s"} before the next step
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={addEmail}
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3.5 py-2 text-sm font-semibold transition-colors hover:border-[color:var(--color-accent-ring)] hover:text-[color:var(--color-accent)]"
          >
            <Plus className="h-3.5 w-3.5" />
            <Mail className="h-3.5 w-3.5" />
            Add email
          </button>
          <button
            onClick={addWait}
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3.5 py-2 text-sm font-semibold transition-colors hover:border-[color:var(--color-accent-ring)] hover:text-[color:var(--color-accent)]"
          >
            <Plus className="h-3.5 w-3.5" />
            <Clock className="h-3.5 w-3.5" />
            Add wait
          </button>
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[color:var(--color-quality-none)] transition-colors hover:bg-[color:var(--color-quality-none)]/10 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-[color:var(--color-status-won)]">Saved ✓</span>
          )}
          <button
            onClick={save}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-5 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
