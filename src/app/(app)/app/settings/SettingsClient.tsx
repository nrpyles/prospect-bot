"use client";

import { useState, useTransition } from "react";
import { Check, Eye, EyeOff, Save, ExternalLink, Sparkles, Key, Building, Landmark, Briefcase, Hammer } from "lucide-react";
import { updateOrgApiKeysAction } from "./actions";
import type { WorkspaceMode } from "@/lib/pipeline";

type SettingsClientProps = {
  orgName: string;
  workspaceMode: WorkspaceMode;
  senderName: string;
  senderCompany: string;
  googleMapsApiKey: string;
  defaultCities: string[];
  defaultIndustries: string[];
  email: string;
  hasAnthropicKey: boolean;
};

// (Hammer icon import lives above with the other lucide imports.)

export function SettingsClient(props: SettingsClientProps) {
  const [mode, setMode] = useState<WorkspaceMode>(props.workspaceMode);
  const [senderName, setSenderName] = useState(props.senderName);
  const [senderCompany, setSenderCompany] = useState(props.senderCompany);
  const [mapsKey, setMapsKey] = useState(props.googleMapsApiKey);
  const [showKey, setShowKey] = useState(false);
  const [defaultCities, setDefaultCities] = useState(props.defaultCities.join(", "));
  const [defaultIndustries, setDefaultIndustries] = useState(props.defaultIndustries.join(", "));
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  function save() {
    setSaving(true);
    startTransition(async () => {
      await updateOrgApiKeysAction({
        workspaceMode: mode,
        senderName: senderName.trim() || null,
        senderCompany: senderCompany.trim() || null,
        googleMapsApiKey: mapsKey.trim() || null,
        defaultCities: defaultCities.split(",").map((c) => c.trim()).filter(Boolean),
        defaultIndustries: defaultIndustries.split(",").map((i) => i.trim()).filter(Boolean),
      });
      setSavedAt(Date.now());
      setSaving(false);
      setTimeout(() => setSavedAt(null), 2000);
    });
  }

  return (
    <div className="space-y-8">
      {/* Workspace mode */}
      <Section icon={<Briefcase className="h-4 w-4" />} title="Workspace mode">
        <p className="-mt-1 mb-3 text-xs text-[color:var(--color-foreground-dim)]">
          Pick your ICP. Changes the AI drafter voice and search defaults across the whole app.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ModeCard
            active={mode === "agency"}
            onClick={() => setMode("agency")}
            icon={<Sparkles className="h-5 w-5" />}
            title="Marketing Agency"
            tagline="FunnelCloser default"
            description="Find local service businesses with weak websites. AI pitches a fix (SSL, mobile, lead capture)."
          />
          <ModeCard
            active={mode === "lending"}
            onClick={() => setMode("lending")}
            icon={<Landmark className="h-5 w-5" />}
            title="Business Lending"
            tagline="Closer Capital voice"
            description="Find mature SMBs with revenue + reviews. AI pitches $25K–$5M in 24–72hr capital. Min 50 reviews."
          />
          <ModeCard
            active={mode === "contractor"}
            onClick={() => setMode("contractor")}
            icon={<Hammer className="h-5 w-5" />}
            title="Blue Collar Lending"
            tagline="Closer Capital contractor partnerships"
            description="Find roofers, HVAC, bath/window contractors. AI pitches 2% dealer fee vs Hearth's 20%. Deductibles play for roofers."
          />
        </div>
      </Section>

      {/* Sender identity */}
      <Section icon={<Building className="h-4 w-4" />} title="Your sender identity">
        <p className="-mt-1 mb-3 text-xs text-[color:var(--color-foreground-dim)]">
          Used by Claude when drafting outreach emails (the AI weaves your name + company into the pitch).
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Your name">
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Neal Pyles"
              className={inputClass}
            />
          </Field>
          <Field label="Your company">
            <input
              type="text"
              value={senderCompany}
              onChange={(e) => setSenderCompany(e.target.value)}
              placeholder={
                mode === "lending" || mode === "contractor"
                  ? "Closer Capital"
                  : "FunnelCloser"
              }
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* Workspace */}
      <Section icon={<Building className="h-4 w-4" />} title="Workspace">
        <Field label="Workspace name" hint="Read-only — derived from your name at signup.">
          <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3.5 py-2.5 text-sm">
            {props.orgName}
          </div>
        </Field>
        <Field label="Signed in as" hint="Manage your account from the user menu (top right).">
          <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3.5 py-2.5 text-sm">
            {props.email}
          </div>
        </Field>
      </Section>

      {/* Google Maps key */}
      <Section icon={<Key className="h-4 w-4" />} title="Google Maps API key">
        <div className="rounded-xl border border-[color:var(--color-accent-ring)] bg-[color:var(--color-accent-soft)] p-4">
          <div className="flex items-start gap-2 text-sm">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--color-accent)]" />
            <div>
              <div className="font-bold text-[color:var(--color-accent)]">Bring your own key (recommended)</div>
              <div className="mt-1 text-xs leading-relaxed text-[color:var(--color-foreground-dim)]">
                Each Google account gets a free $200/mo Maps credit. Get one at{" "}
                <a
                  href="https://console.cloud.google.com/google/maps-apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 underline"
                >
                  Google Cloud Console <ExternalLink className="h-3 w-3" />
                </a>
                .
              </div>
            </div>
          </div>
        </div>

        <Field label="API key" hint="Stored encrypted at rest. Leave blank to use the shared trial key.">
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={mapsKey}
              onChange={(e) => setMapsKey(e.target.value)}
              placeholder="AIza..."
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[color:var(--color-foreground-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
      </Section>

      {/* Anthropic key */}
      <Section icon={<Sparkles className="h-4 w-4" />} title="Anthropic (Claude) API key">
        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-sm">
          {props.hasAnthropicKey ? (
            <div className="flex items-center gap-2 text-[color:var(--color-status-won)]">
              <Check className="h-4 w-4" />
              <span className="font-semibold">FunnelCloser is using the system Anthropic key.</span>
            </div>
          ) : (
            <div className="text-[color:var(--color-quality-terrible)]">
              <span className="font-semibold">No Anthropic key set.</span> AI drafts won&apos;t work.
              Add{" "}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs">ANTHROPIC_API_KEY</code>{" "}
              to your environment variables.
            </div>
          )}
        </div>
      </Section>

      {/* Default search */}
      <Section icon={<Sparkles className="h-4 w-4" />} title="Default search">
        <Field
          label="Default cities"
          hint="Comma-separated. Pre-fills the Find Prospects dialog."
        >
          <input
            type="text"
            value={defaultCities}
            onChange={(e) => setDefaultCities(e.target.value)}
            placeholder="Plano, TX, Frisco, TX"
            className={inputClass}
          />
        </Field>
        <Field label="Default industries" hint="Comma-separated.">
          <input
            type="text"
            value={defaultIndustries}
            onChange={(e) => setDefaultIndustries(e.target.value)}
            placeholder="Roofing, HVAC, Pool Builder"
            className={inputClass}
          />
        </Field>
      </Section>

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/95 px-4 py-3 backdrop-blur-md">
        <div className="text-xs text-[color:var(--color-foreground-dim)]">
          {savedAt ? (
            <span className="inline-flex items-center gap-1.5 text-[color:var(--color-status-won)]">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          ) : (
            "Changes apply org-wide."
          )}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-5 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)] disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  tagline,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  tagline: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-2xl border p-5 text-left transition-all ${
        active
          ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)]"
          : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:border-[color:var(--color-border-strong)]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            active
              ? "bg-[color:var(--color-accent)] text-black"
              : "bg-[color:var(--color-surface-2)] text-[color:var(--color-foreground-dim)] group-hover:text-foreground"
          }`}
        >
          {icon}
        </div>
        {active && (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-black">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="mt-4 text-base font-bold tracking-tight">{title}</div>
      <div
        className={`text-[11px] font-bold uppercase tracking-wider ${
          active ? "text-[color:var(--color-accent)]" : "text-[color:var(--color-foreground-muted)]"
        }`}
      >
        {tagline}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[color:var(--color-foreground-dim)]">
        {description}
      </p>
    </button>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[color:var(--color-foreground-dim)]">
        <span className="text-[color:var(--color-accent)]">{icon}</span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-[color:var(--color-foreground-muted)]">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent-ring)]";
