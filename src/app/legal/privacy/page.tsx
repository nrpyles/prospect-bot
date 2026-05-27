import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · FunnelCloser",
  description: "How FunnelCloser collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <article>
      <p className="eyebrow mb-2">LEGAL</p>
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-[color:var(--color-foreground-muted)]">
        Effective: 2026-05-27. Last updated: 2026-05-27.
      </p>

      <div className="mt-10 space-y-8 text-[color:var(--color-foreground-dim)] leading-relaxed">
        <Section title="What we collect">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Account info:</strong> your name, email, and profile image, provided
              by Clerk during signup.
            </li>
            <li>
              <strong>Workspace data:</strong> prospects you save, search criteria,
              outreach drafts, pipeline activity.
            </li>
            <li>
              <strong>API keys:</strong> third-party keys (Google Maps, Anthropic) you
              optionally configure in Settings, stored encrypted at rest.
            </li>
            <li>
              <strong>Public business data:</strong> when you run a search, we fetch
              publicly available business listings and website content for scoring.
            </li>
          </ul>
        </Section>

        <Section title="What we don't collect">
          <ul className="ml-5 list-disc space-y-1">
            <li>Payment card numbers — handled directly by Stripe.</li>
            <li>The content of your sent emails — we draft, you send.</li>
            <li>Recipient personal data beyond what&apos;s publicly listed on Google Maps.</li>
          </ul>
        </Section>

        <Section title="How we use your data">
          <ul className="ml-5 list-disc space-y-1">
            <li>To operate the Service (search, score, draft).</li>
            <li>To send you product updates and account notifications.</li>
            <li>To improve the product (aggregated, anonymized metrics).</li>
          </ul>
          <p className="mt-2">We never sell your data to third parties.</p>
        </Section>

        <Section title="AI processing">
          <p>
            When you click &quot;Draft AI message&quot;, the prospect&apos;s name, industry,
            city, and website quality issues are sent to Anthropic (Claude) to generate
            the email. Anthropic processes this data per their{" "}
            <a
              href="https://www.anthropic.com/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--color-accent)] underline"
            >
              privacy policy
            </a>
            . We do not retain prompts/completions beyond the immediate request.
          </p>
        </Section>

        <Section title="Cookies + tracking">
          <p>
            We use first-party cookies for authentication (via Clerk) and to remember your
            preferences. No third-party advertising cookies. No analytics SDK that
            transmits personally identifiable information.
          </p>
        </Section>

        <Section title="Data deletion">
          <p>
            You can delete your workspace and all associated data at any time from Settings,
            or email{" "}
            <a href="mailto:hello@funnelcloser.com" className="text-[color:var(--color-accent)] underline">
              hello@funnelcloser.com
            </a>
            . Deletion is permanent and processed within 30 days.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Privacy questions: email{" "}
            <a href="mailto:hello@funnelcloser.com" className="text-[color:var(--color-accent)] underline">
              hello@funnelcloser.com
            </a>
            .
          </p>
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm">{children}</div>
    </section>
  );
}
