"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Sparkles } from "lucide-react";
import { createSequenceAction } from "./actions";

export function CreateSequenceButton({ variant = "default" }: { variant?: "default" | "primary" }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      const created = await createSequenceAction({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setOpen(false);
      setName("");
      setDescription("");
      if (created?.id) router.push(`/app/sequences/${created.id}`);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
          variant === "primary"
            ? "bg-[color:var(--color-accent)] text-black hover:bg-[color:var(--color-accent-hover)] glow-accent"
            : "bg-[color:var(--color-accent)] text-black hover:bg-[color:var(--color-accent-hover)]"
        }`}
      >
        <Plus className="h-4 w-4" />
        New sequence
      </button>

      {open && (
        <>
          <div
            onClick={() => !pending && setOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20">
            <div className="w-full max-w-lg rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
              <div className="flex items-start justify-between border-b border-[color:var(--color-border)] p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[color:var(--color-accent-soft)] p-2">
                    <Sparkles className="h-4 w-4 text-[color:var(--color-accent)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">New sequence</h2>
                    <p className="text-xs text-[color:var(--color-foreground-dim)]">
                      Name it first. You&apos;ll add steps on the next screen.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !pending && setOpen(false)}
                  disabled={pending}
                  className="rounded-lg p-1.5 text-[color:var(--color-foreground-dim)] hover:bg-[color:var(--color-surface-2)] hover:text-foreground disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-sm font-bold">Name</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && name.trim()) submit();
                    }}
                    placeholder="DFW Roofers — Cold Outreach"
                    className="w-full rounded-xl border border-[color:var(--color-border)] bg-background px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent-ring)]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold">
                    Description <span className="text-[color:var(--color-foreground-muted)] font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="3-touch sequence for roofers with No Website grade"
                    rows={3}
                    className="w-full rounded-xl border border-[color:var(--color-border)] bg-background px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent-ring)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[color:var(--color-border)] p-4">
                <button
                  onClick={() => !pending && setOpen(false)}
                  disabled={pending}
                  className="rounded-xl border border-[color:var(--color-border-strong)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[color:var(--color-surface-2)] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={pending || !name.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-5 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)] disabled:opacity-50"
                >
                  {pending ? "Creating…" : "Create + add steps →"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
