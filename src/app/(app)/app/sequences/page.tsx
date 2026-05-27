import Link from "next/link";
import { Mail, Clock, Send, ArrowRight, Sparkles } from "lucide-react";

export default function SequencesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8 lg:py-14">
      <div className="mb-8 flex items-center gap-2">
        <span className="rounded-md bg-[color:var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-accent)]">
          Coming next
        </span>
        <p className="eyebrow">SEQUENCES</p>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
        Multi-touch outreach,{" "}
        <span className="italic text-[color:var(--color-accent)]">on autopilot.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-base text-[color:var(--color-foreground-dim)] leading-relaxed md:text-lg">
        Sequences turn your one-off Claude drafts into a full follow-up engine.
        Email today, wait three days, send the follow-up, breakup on day 14 —
        set it once and let it run.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          {
            icon: Mail,
            title: "Email + wait + follow-up",
            body: "Drag steps to build a sequence. Email day 1, wait 3 days, follow-up, repeat.",
          },
          {
            icon: Sparkles,
            title: "AI-drafted at each step",
            body: "Every email in the sequence is Claude-personalized to the prospect's site.",
          },
          {
            icon: Clock,
            title: "Reply-aware",
            body: "If they reply, the sequence stops immediately and the deal flows to your warm column.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
          >
            <f.icon className="h-5 w-5 text-[color:var(--color-accent)]" />
            <div className="mt-4 text-base font-bold">{f.title}</div>
            <p className="mt-2 text-sm text-[color:var(--color-foreground-dim)] leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <div>
          <div className="text-base font-bold">In the meantime…</div>
          <p className="mt-1 text-sm text-[color:var(--color-foreground-dim)]">
            Use the &quot;Draft all&quot; bulk action on Today&apos;s Playbook to send manually for now.
          </p>
        </div>
        <Link
          href="/app"
          className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-4 py-2 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)]"
        >
          <Send className="h-4 w-4" />
          Go to playbook
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
