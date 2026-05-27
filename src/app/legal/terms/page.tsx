import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service · FunnelCloser",
  description: "FunnelCloser terms of service.",
};

export default function TermsPage() {
  return (
    <article className="prose-invert">
      <p className="eyebrow mb-2">LEGAL</p>
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Terms of Service</h1>
      <p className="mt-3 text-sm text-[color:var(--color-foreground-muted)]">
        Effective: 2026-05-27. Last updated: 2026-05-27.
      </p>

      <div className="mt-10 space-y-8 text-[color:var(--color-foreground-dim)] leading-relaxed">
        <Section title="1. Acceptance">
          <p>
            By accessing or using FunnelCloser (the &quot;Service&quot;), you agree to be bound
            by these Terms. If you do not agree, do not use the Service.
          </p>
        </Section>

        <Section title="2. The Service">
          <p>
            FunnelCloser is a lead-generation and outreach tool. It scans publicly available
            data from Google Maps and websites, scores them against quality heuristics, and
            generates AI-drafted outreach emails. The Service does not send emails on your
            behalf unless you explicitly authorize Gmail OAuth (when available).
          </p>
        </Section>

        <Section title="3. Your account">
          <p>
            You are responsible for the activity on your account, the accuracy of any data
            you input (including third-party API keys), and complying with all applicable
            email/anti-spam laws (CAN-SPAM, GDPR, CASL, etc.) when sending outreach generated
            with the Service.
          </p>
        </Section>

        <Section title="4. API keys and third-party services">
          <p>
            If you choose to use your own Google Maps, Anthropic, or other third-party
            API keys, you are bound by those providers&apos; terms. We store your keys
            encrypted at rest and only use them on your behalf to operate the Service.
          </p>
        </Section>

        <Section title="5. Acceptable use">
          <p>You agree not to use the Service to:</p>
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>Send unsolicited email to consumers (B2C cold email)</li>
            <li>Send to recipients who have opted out</li>
            <li>Impersonate another person or company</li>
            <li>Violate any applicable law in your jurisdiction or the recipient&apos;s</li>
          </ul>
        </Section>

        <Section title="6. Subscriptions and billing">
          <p>
            Paid subscriptions are billed monthly or annually via Stripe. You may cancel
            at any time; cancellations take effect at the end of the current billing
            period. Refunds are issued at our sole discretion.
          </p>
        </Section>

        <Section title="7. Disclaimers">
          <p>
            The Service is provided &quot;as is&quot; without warranty of any kind.
            Website-quality scores are heuristic and do not constitute professional advice.
            AI-drafted emails are suggestions only — you are responsible for reviewing them
            before sending.
          </p>
        </Section>

        <Section title="8. Limitation of liability">
          <p>
            To the maximum extent permitted by law, FunnelCloser&apos;s aggregate liability
            shall not exceed the amounts paid by you to FunnelCloser in the 12 months
            preceding the claim.
          </p>
        </Section>

        <Section title="9. Termination">
          <p>
            We may suspend or terminate your account if you violate these Terms or use the
            Service for spam or abuse. You may cancel and delete your account at any time
            from Settings.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions? Email{" "}
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
