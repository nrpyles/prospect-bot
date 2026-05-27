"use client";

import { useState, useTransition } from "react";
import { Check, Eye, EyeOff, Save, ExternalLink, Sparkles, Key, Building } from "lucide-react";
import { updateOrgApiKeysAction } from "./actions";

type SettingsClientProps = {
  orgName: string;
  googleMapsApiKey: string;
  defaultCities: string[];
  defaultIndustries: string[];
  email: string;
  hasAnthropicKey: boolean;
};

export function SettingsClient(props: SettingsClientProps) {
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
        googleMapsApiKey: mapsKey.trim() || null,
        defaultCities: defaultCities
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        defaultIndustries: defaultIndustries
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
      });
      setSavedAt(Date.now());
      setSaving(false);
      setTimeout(() => setSavedAt(null), 2000);
    });
  }

  return (
    <div className="space-y-8">
      {/* Profile */}
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
                Each Google account gets a free $200/mo Maps credit — enough for ~5,000 searches.
                Set a key here once and your future searches won&apos;t hit FunnelCloser&apos;s shared cap.
                Get one at{" "}
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
              className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-[color:var(--color-accent-ring)]"
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
              Get one at{" "}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">
                console.anthropic.com
              </a>{" "}
              and add it to your{" "}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
              as <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs">ANTHROPIC_API_KEY</code>.
            </div>
          )}
          <p className="mt-2 text-xs text-[color:var(--color-foreground-dim)]">
            Per-organization BYO Anthropic keys are on the roadmap — for now the system uses
            one shared key configured via env var.
          </p>
        </div>
      </Section>

      {/* Default search */}
      <Section icon={<Sparkles className="h-4 w-4" />} title="Default search">
        <Field
          label="Default cities"
          hint="Comma-separated. Used as the pre-fill in the Find Prospects dialog."
        >
          <input
            type="text"
            value={defaultCities}
            onChange={(e) => setDefaultCities(e.target.value)}
            placeholder="Plano, TX, Frisco, TX"
            className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent-ring)]"
          />
        </Field>
        <Field label="Default industries" hint="Comma-separated.">
          <input
            type="text"
            value={defaultIndustries}
            onChange={(e) => setDefaultIndustries(e.target.value)}
            placeholder="Roofing, HVAC, Pool Builder"
            className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent-ring)]"
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
