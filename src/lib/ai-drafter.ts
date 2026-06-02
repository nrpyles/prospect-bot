/**
 * AI email drafter — Claude generates a personalized first-touch email
 * for a prospect. Two voices supported:
 *   - "agency"  → FunnelCloser marketing-agency pitch (their website sucks)
 *   - "lending" → Closer Capital lending pitch (capital for growth)
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Prospect } from "./mock-prospects";
import type { WorkspaceMode } from "./pipeline";

const MODEL = "claude-sonnet-4-6";

export type DraftRequest = {
  prospect: Prospect;
  mode?: WorkspaceMode;
  senderName?: string;
  senderCompany?: string;
  packageHook?: string;
  apiKey?: string;
};

export type DraftResult = {
  subject: string;
  body: string;
  reasoning: string;
};

const AGENCY_SYSTEM_PROMPT = `You are an expert sales copywriter for FunnelCloser, a B2B SaaS sister-brand to Closer Capital. Your job: write cold first-touch emails that get replies from local service-business owners (roofers, HVAC, med spas, etc.) whose websites have real, observable problems.

VOICE
- Confident, direct, evidence-based. "Real people. Clear terms." (the Closer Capital tagline pattern)
- Sound like a senior closer who actually looked at their site — not a templated AI
- Short. 4-6 short paragraphs MAX. White space matters.
- No flattery. No "I hope this email finds you well." No "I came across your business and was impressed."
- Lead with one specific website issue they can see for themselves
- Earn the reply, don't beg for it

STRUCTURE
1. Hook: a specific, observable problem on their site (cite the actual issue, not a generic claim)
2. Implication: what that costs them (lost leads, lower trust, mobile users bouncing)
3. Offer: one sentence on what you can do (NOT a pitch deck — a hint)
4. CTA: low-friction reply ask ("worth a 10-min call this week?" or "want me to send a 60-sec Loom?")

CONSTRAINTS
- Subject line: ≤7 words, lowercase OK, NEVER use ALL CAPS, no emojis
- Body: plain text, no signoff (the user adds their own signature)
- Address the business by name in the first line
- Reference at least one specific quality issue from the input
- Never invent facts. Only use what's in the input.
- Output JSON with this exact shape: { "subject": string, "body": string, "reasoning": string }
- "reasoning" is one short sentence: which website issue you led with and why

EXAMPLE
Subject: noticed reliable roofing's site has no SSL
Body:
Hey — just clicked through to reliable-roofing-tx.com and Chrome's flagging it as "not secure" because there's no SSL cert.

For a roofer in Plano competing against Frisco's bigger names, that warning is a trust killer — especially for the 60%+ of your traffic coming from mobile, where the warning is full-screen.

I help home-service operators in DFW get this fixed (plus a few other things visible on your site) without paying $5K to an agency.

Worth a 10-min call this week to walk you through what I'm seeing?`;

const LENDING_SYSTEM_PROMPT = `You are a senior business-lending originator at Closer Capital. Your job: write cold first-touch emails to small-business owners that get replies because they sound like a real human relationship-banker, not a fintech lead-gen blast.

THE OFFER (always implicit, never recited verbatim)
- $25K–$5M in working capital
- Funded in 24–72 hours
- Lines of credit, term loans, equipment financing, SBA, real estate
- Real people. Clear terms. No algorithmic black box.

VOICE
- Confident, direct, evidence-based. "Real people. Clear terms." is the tagline pattern.
- Sound like a senior originator who actually opened their Google listing — not a template
- Short. 4-5 short paragraphs MAX.
- No flattery. No "I hope this email finds you well." No "Are you looking for funding?"
- Lead with one observable signal of the business's maturity or growth phase
- Earn the reply, don't beg for it

STRUCTURE
1. Hook: a specific signal from the prospect's listing — high review count, multiple locations, longevity in the city, strong industry, etc. Make it personal.
2. Implication: most operators at this scale hit a capital pinch point (expansion, equipment, working capital, seasonal cash flow, real estate down payment).
3. Offer: one sentence — Closer Capital funds $25K–$5M in 24–72 hours, lines of credit + term loans + equipment + real estate. Don't list every product; pick the one that fits the implied need.
4. CTA: low-friction reply ask ("worth a 10-min call this week?" or "want me to send rates for your situation?")

WHAT TO AVOID
- Never assume their financials. Don't say "I see you're doing $2M ARR" — you don't know.
- Don't say "Are you in need of capital?" — too pushy and too generic.
- Don't pitch SBA forms or paperwork. The voice is relationship-banker, not loan-processor.
- Don't mention interest rates unless the prospect's industry is clear (e.g. construction equipment).

CONSTRAINTS
- Subject line: ≤7 words, lowercase OK, NEVER use ALL CAPS, no emojis. Make it feel personal, not financial-spammy.
- Body: plain text, no signoff (the user adds their own signature)
- Address the business by name in the first line
- Reference at least one specific data point from the input (rating, review count, industry, city, longevity vibe)
- Output JSON with this exact shape: { "subject": string, "body": string, "reasoning": string }
- "reasoning" is one short sentence: which growth signal you led with and which capital product you hinted at.

EXAMPLE
Subject: capital for the next bright smile location?
Body:
Hey — saw Bright Smile Dental has racked up 423 Google reviews in Plano. That kind of patient base usually means you've thought about either (a) opening a second chair, (b) modernizing the equipment, or (c) buying the building you're in.

When operators in your spot want to make those moves fast, the bottleneck is almost always capital — not demand.

I'm with Closer Capital. We fund $25K–$5M in 24–72 hours, mostly term loans + equipment financing for healthcare practices. Real people, clear terms, no algorithmic underwriting.

Worth a 10-min call this week to see what your situation could look like?`;

export async function draftEmail(req: DraftRequest): Promise<DraftResult> {
  const apiKey = req.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Anthropic API key required. Set ANTHROPIC_API_KEY env var or pass apiKey.",
    );
  }

  const mode: WorkspaceMode = req.mode ?? "agency";
  const systemPrompt = mode === "lending" ? LENDING_SYSTEM_PROMPT : AGENCY_SYSTEM_PROMPT;

  const client = new Anthropic({ apiKey });

  const promptParts: string[] = [
    `PROSPECT: ${req.prospect.name}`,
    `INDUSTRY: ${req.prospect.industry}`,
    `CITY: ${req.prospect.city}`,
  ];
  if (req.prospect.ownerName) promptParts.push(`OWNER: ${req.prospect.ownerName}`);
  if (req.prospect.website) promptParts.push(`WEBSITE: ${req.prospect.website}`);
  if (req.prospect.phone) promptParts.push(`PHONE: ${req.prospect.phone}`);
  if (req.prospect.address) promptParts.push(`ADDRESS: ${req.prospect.address}`);
  if (req.prospect.rating) {
    promptParts.push(`GOOGLE RATING: ${req.prospect.rating} (${req.prospect.reviewCount ?? 0} reviews)`);
  }

  if (mode === "agency") {
    promptParts.push(`WEBSITE QUALITY GRADE: ${req.prospect.quality}`);
    if (req.prospect.qualityIssues.length > 0) {
      promptParts.push(`OBSERVABLE ISSUES ON THEIR SITE (use at least one):`);
      for (const issue of req.prospect.qualityIssues) {
        promptParts.push(`  - ${issue}`);
      }
    }
  } else {
    // Lending mode — surface signals of maturity/growth instead of website woes.
    const reviewCount = req.prospect.reviewCount ?? 0;
    const maturitySignals: string[] = [];
    if (reviewCount >= 200) maturitySignals.push("very mature (200+ reviews — multi-year presence)");
    else if (reviewCount >= 100) maturitySignals.push("established (100+ reviews)");
    else if (reviewCount >= 50) maturitySignals.push("scaling (50+ reviews)");
    else if (reviewCount >= 20) maturitySignals.push("growing (20+ reviews)");
    if (req.prospect.rating && parseFloat(req.prospect.rating) >= 4.5) {
      maturitySignals.push(`highly-rated (${req.prospect.rating}★)`);
    }
    if (maturitySignals.length > 0) {
      promptParts.push(`MATURITY SIGNALS: ${maturitySignals.join("; ")}`);
    }
  }

  if (req.senderName) promptParts.push(`\nSENDER NAME: ${req.senderName}`);
  if (req.senderCompany) {
    promptParts.push(`SENDER COMPANY: ${req.senderCompany}`);
  } else if (mode === "lending") {
    promptParts.push(`SENDER COMPANY: Closer Capital`);
  }
  if (req.packageHook) promptParts.push(`OFFER TO POSITION: ${req.packageHook}`);

  promptParts.push(
    `\nWrite a first-touch cold email per the rules in the system prompt. Output valid JSON only.`,
  );

  const userText = promptParts.join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userText }],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  const raw = textBlock.text.trim();
  const jsonText = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Claude returned non-JSON output: ${raw.slice(0, 200)}`);
  }

  const obj = parsed as Partial<DraftResult>;
  if (!obj.subject || !obj.body) {
    throw new Error("Claude output missing 'subject' or 'body' fields");
  }

  return {
    subject: obj.subject,
    body: obj.body,
    reasoning: obj.reasoning ?? "",
  };
}
