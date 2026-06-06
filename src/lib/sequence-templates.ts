/**
 * Pre-built sequence templates per workspace mode.
 * One-click "Start from template" on the sequences page.
 *
 * Email bodies use template variables resolved at send time:
 *   {{name}} {{industry}} {{city}} {{website}} {{owner}}
 * Steps marked useAiDraft let Claude personalize per prospect (the body
 * here is a fallback / starting point).
 */
import type { WorkspaceMode } from "./pipeline";

export type TemplateStep =
  | { kind: "email"; subject: string; body: string; useAiDraft: boolean }
  | { kind: "wait"; waitDays: number };

export type SequenceTemplate = {
  id: string;
  name: string;
  description: string;
  mode: WorkspaceMode;
  steps: TemplateStep[];
};

export const SEQUENCE_TEMPLATES: SequenceTemplate[] = [
  {
    id: "blue-collar-round-one",
    mode: "contractor",
    name: "Blue Collar Lending — Round One",
    description:
      "The 5-touch, 14-day cadence from the Blue Collar Lending playbook. Opens with the Hearth fee math, hits the deductible play, lands the $4,500/job recapture, then closes on Round-One scarcity before a low-pressure breakup.",
    steps: [
      {
        kind: "email",
        subject: "what hearth is costing {{name}} per job",
        useAiDraft: true,
        body: `Hey — saw {{name}} is running serious volume in {{city}}. That usually means you're financing a lot of jobs through Hearth or GoodLeap.

Here's the part nobody likes to do the math on: on a $25K job at a 20% dealer fee, you hand them $5,000. With Blue Collar Lending it's a flat 2% — $500. That's $4,500 back in your pocket. Per job.

I'm with Closer Capital. Funds wire direct to you, same-day approval, 7.99–9.99% fixed for the homeowner. Texas + Oklahoma pilot, Round One.

Worth a 10-min call this week to run the fee math against your last month?`,
      },
      { kind: "wait", waitDays: 3 },
      {
        kind: "email",
        subject: "stop eating the deductible",
        useAiDraft: true,
        body: `Quick follow-up for {{name}} — one thing Hearth and GoodLeap both refuse to do: finance the homeowner's insurance deductible.

We're the only program that does. Stop eating deductibles, stop chasing supplements. The homeowner finances it, you get paid in full, funds wire direct to you.

2% flat dealer fee, same-day approval. Want me to send you the one-pager?`,
      },
      { kind: "wait", waitDays: 3 },
      {
        kind: "email",
        subject: "$4,500 a job, $540k a year",
        useAiDraft: true,
        body: `Last time I'll send the numbers, then I'll get out of your inbox.

10 financed jobs a month at $25K each:
• Hearth/GoodLeap at 20% = $5,000/job you give away
• Blue Collar at 2% = $500/job
• You keep $4,500 per job — that's $45,000/month, $540,000/year

That's margin you're handing the competition right now. Same homeowner experience, same approval speed, your money instead of theirs.

10 minutes this week?`,
      },
      { kind: "wait", waitDays: 3 },
      {
        kind: "email",
        subject: "round one is filling up",
        useAiDraft: true,
        body: `{{name}} — the Texas + Oklahoma pilot is Round One and we're capping the number of contractor partners per market so the program doesn't cannibalize itself.

If you want in, the setup is fast: sign the partner agreement, drop in your ACH info, get your tracking link. You can be closing financed jobs this week with white-label tech that looks like it's yours.

Want me to send the agreement over?`,
      },
      { kind: "wait", waitDays: 4 },
      {
        kind: "email",
        subject: "last note",
        useAiDraft: true,
        body: `I'll leave it here, {{name}}.

If you ever want to stop handing 20% of every financed job to Hearth or GoodLeap, the door's open — 2% flat, funds direct to you, deductibles eligible. Reply anytime and I'll get you set up.

Either way, good luck out there.`,
      },
    ],
  },
  {
    id: "agency-bad-website-3touch",
    mode: "agency",
    name: "Bad Website — 3-Touch",
    description:
      "A tight 3-email, 7-day sequence for businesses with weak websites. Leads with a specific observable issue, follows up with the cost of inaction, then a low-pressure breakup.",
    steps: [
      {
        kind: "email",
        subject: "noticed an issue on {{name}}'s site",
        useAiDraft: true,
        body: `Hey — clicked through to {{website}} and noticed a couple things that are probably costing you leads. Worth a quick look if you've got a sec.

I help {{industry}} businesses in {{city}} fix this stuff without the $5K agency retainer. Want me to send over what I'm seeing?`,
      },
      { kind: "wait", waitDays: 3 },
      {
        kind: "email",
        subject: "the math on a slow site",
        useAiDraft: true,
        body: `Following up on {{name}} — the issues I flagged matter more than they look. Most of your traffic is mobile, and a site that loads slow or flags "not secure" loses those visitors before they ever call.

10-min call this week to walk through the fixes?`,
      },
      { kind: "wait", waitDays: 4 },
      {
        kind: "email",
        subject: "last one",
        useAiDraft: true,
        body: `I'll stop here, {{name}}. If you ever want to turn that site into something that actually books jobs, reply and I'll send a quick plan. Otherwise, all good — good luck out there.`,
      },
    ],
  },
  {
    id: "lending-capital-3touch",
    mode: "lending",
    name: "Capital Pitch — 3-Touch",
    description:
      "A 3-email, 9-day sequence for mature SMBs. Opens on a growth signal, hints at a capital pinch point, closes with Closer Capital's speed.",
    steps: [
      {
        kind: "email",
        subject: "quick one for {{name}}",
        useAiDraft: true,
        body: `Hey — {{name}} has clearly built something real in {{city}}. Operators at your scale usually hit a capital pinch point at some stage: expansion, equipment, a real estate move, or just smoothing out seasonal cash flow.

I'm with Closer Capital. We fund $25K–$5M in 24–72 hours — real people, clear terms, no algorithmic black box. Worth a 10-min call?`,
      },
      { kind: "wait", waitDays: 4 },
      {
        kind: "email",
        subject: "speed is the whole point",
        useAiDraft: true,
        body: `Following up, {{name}} — the reason operators use us over a bank: a HELOC takes 30 days, we close in 24–72 hours. When a deal or a piece of equipment is in front of you, capital speed is the difference.

Want me to send rates for your situation?`,
      },
      { kind: "wait", waitDays: 5 },
      {
        kind: "email",
        subject: "last note",
        useAiDraft: true,
        body: `I'll leave it here, {{name}}. If a capital need ever comes up — fast — reply and I'll get you terms same day. Good luck out there.`,
      },
    ],
  },
];

export function templatesForMode(mode: WorkspaceMode): SequenceTemplate[] {
  // Show the mode's own template(s) first, then the rest.
  return [
    ...SEQUENCE_TEMPLATES.filter((t) => t.mode === mode),
    ...SEQUENCE_TEMPLATES.filter((t) => t.mode !== mode),
  ];
}

export function getTemplate(id: string): SequenceTemplate | undefined {
  return SEQUENCE_TEMPLATES.find((t) => t.id === id);
}
