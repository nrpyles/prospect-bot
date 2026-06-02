"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Phone, Mail, MapPin, Trash2, Save, Sparkles, Search, Copy, Check, Layers } from "lucide-react";
import type { Prospect } from "@/lib/mock-prospects";
import { buildResearchLinks } from "@/lib/research-links";
import {
  STATUSES,
  QUALITIES,
  INDUSTRIES,
  SOURCES,
  STATUS_COLORS,
  QUALITY_COLORS,
  type Status,
  type Quality,
  type Industry,
  type Source,
} from "@/lib/pipeline";
import { AIDraftView } from "./AIDraftView";
import { SequencePicker } from "./SequencePicker";
import { FindEmailButton } from "./FindEmailButton";

type DrawerMode = "view" | "edit" | "draft";

type ProspectDrawerProps = {
  prospect: Prospect | null;
  onClose: () => void;
  onSave: (updated: Prospect) => void;
  onDelete: (id: string) => void;
};

// Inline helper for DetailView email row — needs onSave callback so we
// hoist the prospect/onSave refs down through a closure.

export function ProspectDrawer({ prospect, onClose, onSave, onDelete }: ProspectDrawerProps) {
  const [draft, setDraft] = useState<Prospect | null>(prospect);
  const [mode, setMode] = useState<DrawerMode>("view");
  const [sequencePickerOpen, setSequencePickerOpen] = useState(false);

  useEffect(() => {
    setDraft(prospect);
    setMode("view");
    setSequencePickerOpen(false);
  }, [prospect]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (prospect) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prospect, onClose]);

  if (!prospect || !draft) return null;

  function field<K extends keyof Prospect>(key: K, value: Prospect[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />
      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-xl flex-col border-l border-[color:var(--color-border)] bg-background shadow-[0_0_80px_-20px_rgba(0,0,0,0.9)]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[color:var(--color-border)] p-6">
          <div className="flex-1 pr-4">
            {mode === "edit" ? (
              <input
                value={draft.name}
                onChange={(e) => field("name", e.target.value)}
                className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none focus:border-b focus:border-[color:var(--color-accent)]"
              />
            ) : (
              <h2 className="text-2xl font-bold tracking-tight">{draft.name}</h2>
            )}
            <p className="mt-1 text-sm text-[color:var(--color-foreground-dim)]">
              {draft.ownerName ?? "—"} · {draft.city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[color:var(--color-foreground-dim)] transition-colors hover:bg-[color:var(--color-surface)] hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--color-border)] px-6 py-4">
          <Badge color={STATUS_COLORS[draft.status]}>{draft.status}</Badge>
          <Badge color="var(--color-accent)">{draft.industry}</Badge>
          <Badge color={QUALITY_COLORS[draft.quality]}>{draft.quality}</Badge>
          {draft.rating && (
            <span className="mono-stat text-sm text-[color:var(--color-status-followup)]">
              {draft.rating}★ ({draft.reviewCount ?? 0})
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === "edit" ? (
            <EditForm draft={draft} setDraft={setDraft} />
          ) : mode === "draft" ? (
            <AIDraftView prospect={draft} onBack={() => setMode("view")} />
          ) : (
            <DetailView
              prospect={draft}
              onEmailFound={(email) => {
                const updated = { ...draft, email };
                setDraft(updated);
                onSave(updated);
              }}
            />
          )}
        </div>

        {/* Footer actions — hidden in draft mode (AIDraftView has its own) */}
        {mode !== "draft" && (
          <div className="flex items-center justify-between border-t border-[color:var(--color-border)] p-4">
            <button
              onClick={() => {
                if (confirm("Delete this prospect?")) onDelete(draft.id);
              }}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[color:var(--color-quality-none)] transition-colors hover:bg-[color:var(--color-quality-none)]/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>

            <div className="flex items-center gap-2">
              {mode === "edit" ? (
                <>
                  <button
                    onClick={() => {
                      setDraft(prospect);
                      setMode("view");
                    }}
                    className="rounded-xl border border-[color:var(--color-border-strong)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[color:var(--color-surface)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onSave(draft);
                      setMode("view");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-4 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)]"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSequencePickerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3 py-2 text-sm font-semibold transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
                    title="Enroll in a sequence"
                  >
                    <Layers className="h-4 w-4" />
                    <span className="hidden sm:inline">Enroll</span>
                  </button>
                  <button
                    onClick={() => setMode("draft")}
                    className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] px-3 py-2 text-sm font-bold text-[color:var(--color-accent)] transition-colors hover:bg-[color:var(--color-accent)] hover:text-black"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">Draft AI message</span>
                    <span className="sm:hidden">AI</span>
                  </button>
                  <button
                    onClick={() => setMode("edit")}
                    className="rounded-xl bg-[color:var(--color-accent)] px-4 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)]"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </aside>

      <SequencePicker
        open={sequencePickerOpen}
        prospectId={prospect.id}
        prospectName={prospect.name}
        onClose={() => setSequencePickerOpen(false)}
      />
    </>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      {children}
    </span>
  );
}

function DetailView({
  prospect,
  onEmailFound,
}: {
  prospect: Prospect;
  onEmailFound?: (email: string) => void;
}) {
  return (
    <div className="space-y-7">
      {/* Research — prominent, top of drawer */}
      <ResearchSection prospect={prospect} />

      {/* Contact */}
      <section>
        <h3 className="eyebrow mb-3">CONTACT</h3>
        <ul className="space-y-2 text-sm">
          {prospect.phone && (
            <CopyableContactRow icon={<Phone className="h-4 w-4" />} label={prospect.phone} value={prospect.phone} />
          )}
          {prospect.email ? (
            <CopyableContactRow icon={<Mail className="h-4 w-4" />} label={prospect.email} value={prospect.email} />
          ) : (
            <li>
              <FindEmailButton
                prospectId={prospect.id}
                hasWebsite={Boolean(prospect.website)}
                onEmailFound={(email) => onEmailFound?.(email)}
              />
            </li>
          )}
          {prospect.address && (
            <ContactRow icon={<MapPin className="h-4 w-4" />} label={prospect.address} />
          )}
        </ul>
      </section>

      {/* Quality issues */}
      {prospect.qualityIssues.length > 0 && (
        <section>
          <h3 className="eyebrow mb-3">WEBSITE ISSUES</h3>
          <ul className="space-y-1.5">
            {prospect.qualityIssues.map((issue) => (
              <li
                key={issue}
                className="flex items-start gap-2 text-sm text-[color:var(--color-foreground-dim)]"
              >
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[color:var(--color-quality-terrible)]" />
                {issue}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Deal */}
      {(prospect.valueCents || prospect.packageName) && (
        <section>
          <h3 className="eyebrow mb-3">DEAL</h3>
          <div className="grid grid-cols-2 gap-3">
            {prospect.packageName && (
              <KV label="Package" value={prospect.packageName} />
            )}
            {prospect.valueCents != null && (
              <KV
                label="Value"
                value={`$${(prospect.valueCents / 100).toLocaleString()}`}
                color="var(--color-status-won)"
              />
            )}
          </div>
        </section>
      )}

      {/* Activity */}
      <section>
        <h3 className="eyebrow mb-3">ACTIVITY</h3>
        <div className="grid grid-cols-2 gap-3">
          <KV label="Source" value={prospect.source} />
          {prospect.channel && <KV label="Channel" value={prospect.channel} />}
          {prospect.lastContactedAt && (
            <KV label="Last Contact" value={prospect.lastContactedAt} />
          )}
          {prospect.nextFollowUpAt && (
            <KV label="Next Follow Up" value={prospect.nextFollowUpAt} />
          )}
          <KV label="Date Added" value={prospect.createdAt} />
        </div>
      </section>

      {/* Notes */}
      {prospect.notes && (
        <section>
          <h3 className="eyebrow mb-3">NOTES</h3>
          <p className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-sm text-[color:var(--color-foreground-dim)] leading-relaxed">
            {prospect.notes}
          </p>
        </section>
      )}
    </div>
  );
}

function ContactRow({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}) {
  const content = (
    <span className="flex items-center gap-3 text-[color:var(--color-foreground)]">
      <span className="text-[color:var(--color-foreground-muted)]">{icon}</span>
      {label}
    </span>
  );
  return (
    <li>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-[color:var(--color-accent)]">
          {content}
        </a>
      ) : (
        content
      )}
    </li>
  );
}

function CopyableContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }
  return (
    <li className="group flex items-center justify-between rounded-lg px-2 -mx-2 py-1.5 hover:bg-[color:var(--color-surface)]">
      <span className="flex items-center gap-3 text-[color:var(--color-foreground)]">
        <span className="text-[color:var(--color-foreground-muted)]">{icon}</span>
        {label}
      </span>
      <button
        onClick={onCopy}
        title="Copy"
        className="opacity-0 transition-opacity group-hover:opacity-100"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[color:var(--color-status-won)]" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-[color:var(--color-foreground-muted)] transition-colors hover:text-foreground" />
        )}
      </button>
    </li>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.62 0 4.29 2.38 4.29 5.48v6.26zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.6 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}

function ResearchSection({ prospect }: { prospect: Prospect }) {
  const links = buildResearchLinks(prospect, prospect.googlePlaceId);
  const iconMap: Record<string, React.ReactNode> = {
    maps: <MapPin className="h-4 w-4" />,
    search: <Search className="h-4 w-4" />,
    website: <ExternalLink className="h-4 w-4" />,
    linkedin: <LinkedinIcon className="h-4 w-4" />,
    facebook: <FacebookIcon className="h-4 w-4" />,
  };

  return (
    <section>
      <h3 className="eyebrow mb-3">RESEARCH BEFORE YOU REACH OUT</h3>
      <div className="grid grid-cols-2 gap-2">
        {links.map((link) => (
          <a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-[color:var(--color-accent-ring)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-accent)]"
          >
            <span className="flex items-center gap-2.5">
              <span className="text-[color:var(--color-foreground-muted)] transition-colors group-hover:text-[color:var(--color-accent)]">
                {iconMap[link.key] ?? <ExternalLink className="h-4 w-4" />}
              </span>
              {link.label}
            </span>
            <ExternalLink className="h-3 w-3 text-[color:var(--color-foreground-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ))}
      </div>
    </section>
  );
}

function KV({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="eyebrow mb-1 text-[10px]">{label}</div>
      <div className="text-sm font-semibold" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}

function EditForm({
  draft,
  setDraft,
}: {
  draft: Prospect;
  setDraft: React.Dispatch<React.SetStateAction<Prospect | null>>;
}) {
  function set<K extends keyof Prospect>(key: K, value: Prospect[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Owner Name">
          <input
            value={draft.ownerName ?? ""}
            onChange={(e) => set("ownerName", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Industry">
          <select
            value={draft.industry}
            onChange={(e) => set("industry", e.target.value as Industry)}
            className={inputClass}
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </Field>
      </Row>
      <Row>
        <Field label="City">
          <input
            value={draft.city}
            onChange={(e) => set("city", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Phone">
          <input
            value={draft.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
            className={inputClass}
          />
        </Field>
      </Row>
      <Row>
        <Field label="Email">
          <input
            value={draft.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Website">
          <input
            value={draft.website ?? ""}
            onChange={(e) => set("website", e.target.value)}
            className={inputClass}
          />
        </Field>
      </Row>
      <Row>
        <Field label="Status">
          <select
            value={draft.status}
            onChange={(e) => set("status", e.target.value as Status)}
            className={inputClass}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Website Quality">
          <select
            value={draft.quality}
            onChange={(e) => set("quality", e.target.value as Quality)}
            className={inputClass}
          >
            {QUALITIES.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </Field>
      </Row>
      <Row>
        <Field label="Source">
          <select
            value={draft.source}
            onChange={(e) => set("source", e.target.value as Source)}
            className={inputClass}
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Deal Value ($)">
          <input
            type="number"
            value={draft.valueCents != null ? draft.valueCents / 100 : ""}
            onChange={(e) =>
              set(
                "valueCents",
                e.target.value === "" ? undefined : Math.round(Number(e.target.value) * 100),
              )
            }
            className={inputClass}
            placeholder="e.g. 2500"
          />
        </Field>
      </Row>
      <Field label="Notes">
        <textarea
          value={draft.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </Field>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block text-[10px]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--color-accent)]";
