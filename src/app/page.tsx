import Link from "next/link";
import { ArrowRight, Sparkles, Target, Search, Send, Layers, Mail, Layout, Lock } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        {/* ───────── HERO ───────── */}
        <section className="relative overflow-hidden hero-halo">
          <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-32 lg:px-10 lg:pt-28 lg:pb-40">
            <div className="flex items-center gap-2 fade-up">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)] pulse-soft" />
              <p className="eyebrow">A CLOSER FAMILY BRAND · EST. 2026</p>
            </div>

            <h1 className="display-xl mt-10 max-w-[18ch] fade-up" style={{ animationDelay: "60ms" }}>
              Find leads.{" "}
              <span className="serif-italic text-[color:var(--color-accent)]">Close</span>{" "}
              deals. Skip the busywork.
            </h1>

            <p
              className="mt-8 max-w-2xl text-lg leading-relaxed text-[color:var(--color-foreground-dim)] md:text-xl fade-up"
              style={{ animationDelay: "120ms" }}
            >
              FunnelCloser scans your local market for businesses with weak
              websites, scores them by opportunity, and{" "}
              <span className="serif-italic text-[color:var(--color-foreground)]">writes the cold email for you</span>
              {" — "}so you spend your time on calls, not lists.
            </p>

            <div
              className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:items-center fade-up"
              style={{ animationDelay: "180ms" }}
            >
              <Link
                href="/sign-up"
                className="group inline-flex h-14 items-center gap-2 rounded-full bg-[color:var(--color-accent)] px-8 text-base font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)] glow-accent"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#how"
                className="inline-flex h-14 items-center rounded-full border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)]/40 px-8 text-base font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-[color:var(--color-surface)]"
              >
                See how it works
              </Link>
            </div>

            {/* Stat bar */}
            <div
              className="mt-24 grid gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-border)] md:grid-cols-4 fade-up"
              style={{ animationDelay: "240ms" }}
            >
              {[
                { num: "20+", label: "INDUSTRIES SUPPORTED", note: "From roofers to med spas" },
                { num: "100%", label: "DATA YOU OWN", note: "Your DB, your keys" },
                { num: "AI", label: "PERSONALIZED OUTREACH", note: "Claude drafts each email" },
                { num: "24/7", label: "BACKGROUND PROSPECTING", note: "Runs while you sleep" },
              ].map((s) => (
                <div key={s.label} className="bg-background p-7">
                  <div className="mono-stat text-3xl text-foreground md:text-4xl">{s.num}</div>
                  <div className="eyebrow mt-2.5 text-[10px]">{s.label}</div>
                  <div className="mt-2 serif-italic text-sm text-[color:var(--color-foreground-dim)]">
                    {s.note}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Marquee strip */}
          <div className="relative overflow-hidden border-y border-[color:var(--color-border)] bg-[color:var(--color-background-2)] py-5">
            <div className="marquee-track flex gap-12 whitespace-nowrap">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex shrink-0 gap-12">
                  {["ROOFING", "HVAC", "FENCING", "PLUMBING", "LANDSCAPING", "GARAGE DOORS", "MED SPA", "DENTIST", "PEST CONTROL", "CONCRETE", "POOL BUILDER", "PAINTING", "ELECTRICAL", "TREE SERVICE", "PRESSURE WASHING", "FLOORING", "WINDOW CLEANING", "MOVING", "JUNK REMOVAL", "AUTO DETAILING"].map((label) => (
                    <span key={`${i}-${label}`} className="mono-tag flex items-center gap-3 text-[color:var(--color-foreground-muted)]">
                      <span className="h-1 w-1 rounded-full bg-[color:var(--color-accent)]/60" />
                      {label}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── HOW IT WORKS ───────── */}
        <section id="how" className="border-b border-[color:var(--color-border)]">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
            <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
              <div className="lg:sticky lg:top-32 lg:self-start">
                <p className="eyebrow mb-6">HOW IT WORKS</p>
                <h2 className="display-lg">
                  Three steps from a <span className="serif-italic">city name</span> to a closed deal.
                </h2>
              </div>

              <div className="space-y-12">
                {[
                  {
                    num: "01",
                    icon: Target,
                    title: "Target",
                    body: "Pick the cities and industries you want to close — roofers in Plano, med spas in Frisco, HVAC across DFW. We're not a stale database. We hunt fresh, every day.",
                  },
                  {
                    num: "02",
                    icon: Search,
                    title: "Find",
                    body: "Our bot scans Google Maps, scores each business's website for SSL, mobile readiness, lead capture, and freshness — and only surfaces the ones that need what you sell.",
                  },
                  {
                    num: "03",
                    icon: Send,
                    title: "Close",
                    body: "Claude drafts a first-touch email tailored to each prospect's actual website issues. Sent from your Gmail — so it lands in inbox, not spam.",
                  },
                ].map((step) => (
                  <div key={step.num} className="group flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="mono-stat text-2xl text-[color:var(--color-accent)]">{step.num}</div>
                      <div className="mt-3 h-full w-px bg-gradient-to-b from-[color:var(--color-accent)] to-transparent" />
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="mb-3 flex items-center gap-2">
                        <step.icon className="h-5 w-5 text-[color:var(--color-accent)]" />
                        <h3 className="text-xl font-bold tracking-tight">{step.title}</h3>
                      </div>
                      <p className="text-[color:var(--color-foreground-dim)] leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────── PULL QUOTE ───────── */}
        <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background-2)]">
          <div className="mx-auto max-w-5xl px-6 py-24 text-center lg:px-10 lg:py-32">
            <p className="eyebrow mb-8">THE THESIS</p>
            <p className="display-md text-[color:var(--color-foreground)]">
              The best leads are the ones that{" "}
              <span className="serif-italic text-[color:var(--color-accent)]">already have a problem</span>{" "}
              you can see — and the worst ones are everyone else.
            </p>
          </div>
        </section>

        {/* ───────── FEATURES ───────── */}
        <section id="features" className="border-b border-[color:var(--color-border)]">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
            <div className="mb-16 max-w-3xl">
              <p className="eyebrow mb-6">WHAT&apos;S INSIDE</p>
              <h2 className="display-lg">
                Everything a one-person closer needs.{" "}
                <span className="serif-italic text-[color:var(--color-foreground-dim)]">Nothing they don&apos;t.</span>
              </h2>
            </div>

            <div className="grid gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-border)] md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Layout,
                  title: "Website quality scoring",
                  body: "Every prospect gets graded — No Website, Terrible, Outdated, Decent, Good — so you focus on deals worth closing.",
                },
                {
                  icon: Sparkles,
                  title: "AI-drafted first touches",
                  body: "Claude reads the prospect's actual website and writes a hook based on what's broken. No generic templates.",
                },
                {
                  icon: Mail,
                  title: "Send from your Gmail",
                  body: "Connect once. Outreach goes out from your inbox — same deliverability, same reply tracking, no spam-trap risk.",
                },
                {
                  icon: Layers,
                  title: "Drag-to-stage pipeline",
                  body: "Six-stage flow from New Lead to Closed Won. Built for solo closers and small teams who actually use it.",
                },
                {
                  icon: Send,
                  title: "Multi-touch sequences",
                  body: "Email today, follow up in 3 days, breakup at day 14. Set it once, let it run, get notified on reply.",
                },
                {
                  icon: Lock,
                  title: "Bring-your-own keys",
                  body: "Your Google Maps key, your Gmail, your data. We never bill you for usage you don't control.",
                },
              ].map((f) => (
                <div key={f.title} className="group relative bg-background p-8 transition-colors hover:bg-[color:var(--color-surface)]">
                  <f.icon className="h-6 w-6 text-[color:var(--color-accent)]" />
                  <h3 className="mt-5 text-lg font-bold tracking-tight">{f.title}</h3>
                  <p className="mt-3 text-sm text-[color:var(--color-foreground-dim)] leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── FAMILY ───────── */}
        <section className="border-b border-[color:var(--color-border)]">
          <div className="mx-auto max-w-5xl px-6 py-24 text-center lg:px-10 lg:py-32">
            <p className="eyebrow mb-8">THE CLOSER FAMILY</p>
            <h2 className="display-lg">
              Built by the team behind{" "}
              <Link
                href="https://closercap.com"
                target="_blank"
                className="serif-italic text-[color:var(--color-accent)] underline-offset-[6px] decoration-1 hover:underline"
              >
                Closer Capital
              </Link>
              .
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[color:var(--color-foreground-dim)]">
              We&apos;ve spent years helping operators close deals at Closer Capital.
              FunnelCloser is what happens when we point that same energy at the
              very top of the funnel.
            </p>
          </div>
        </section>

        {/* ───────── FINAL CTA ───────── */}
        <section id="pricing" className="relative overflow-hidden hero-halo">
          <div className="mx-auto max-w-5xl px-6 py-28 text-center lg:px-10 lg:py-36">
            <p className="eyebrow mb-8">READY?</p>
            <h2 className="display-xl">
              Stop hunting. <span className="serif-italic">Start closing.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-[color:var(--color-foreground-dim)]">
              Free 14-day trial. No credit card. Cancel any time.{" "}
              <span className="serif-italic text-foreground">Early subscribers lock founder rates.</span>
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="group inline-flex h-14 items-center gap-2 rounded-full bg-[color:var(--color-accent)] px-8 text-base font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)] glow-accent"
              >
                Claim founder access
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="mailto:hello@funnelcloser.com"
                className="inline-flex h-14 items-center rounded-full border border-[color:var(--color-border-strong)] px-8 text-base font-semibold text-foreground transition-colors hover:bg-[color:var(--color-surface)]"
              >
                Talk to a human
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
