/**
 * AI email drafter — Claude generates a personalized first-touch email
 * for a prospect based on their website's actual issues.
 *
 * The Closer family voice: confident, direct, evidence-based.
 * No fluff, no fake compliments, no "I hope this email finds you well."
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Prospect } from "./mock-prospects";

const MODEL = "claude-sonnet-4-6";

export type DraftRequest = {
  prospect: Prospect;
  senderName?: string;
  senderCompany?: string;
  packageHook?: string; // optional: what product/service to position
  apiKey?: string; // BYO Anthropic key (optional; falls back to env)
};

export type DraftResult = {
  subject: string;
  body: string;
  reasoning: string;
};

const SYSTEM_PROMPT = `You are an expert sales copywriter for FunnelCloser, a B2B SaaS sister-brand to Closer Capital. Your job: write cold first-touch emails that get replies from local service-business owners (roofers, HVAC, med spas, etc.) whose websites have real, observable problems.

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

EXAMPLES OF WHAT NOT TO DO
- "I hope this email finds you well!" → CUT
- "I was browsing Google and came across Premier Garage Doors..." → CUT
- "Have you considered a website redesign?" → CUT (too generic)
- Long preambles before the hook → CUT

EXAMPLE OF WHAT TO DO
Subject: noticed reliable roofing's site has no SSL
Body:
Hey — just clicked through to reliable-roofing-tx.com and Chrome's flagging it as "not secure" because there's no SSL cert.

For a roofer in Plano competing against Frisco's bigger names, that warning is a trust killer — especially for the 60%+ of your traffic coming from mobile, where the warning is full-screen.

I help home-service operators in DFW get this fixed (plus a few other things visible on your site) without paying $5K to an agency.

Worth a 10-min call this week to walk you through what I'm seeing?`;

export async function draftEmail(req: DraftRequest): Promise<DraftResult> {
  const apiKey = req.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Anthropic API key required. Set ANTHROPIC_API_KEY env var or pass apiKey.",
    );
  }

  const client = new Anthropic({ apiKey });

  const promptParts: string[] = [
    `PROSPECT: ${req.prospect.name}`,
    `INDUSTRY: ${req.prospect.industry}`,
    `CITY: ${req.prospect.city}`,
  ];
  if (req.prospect.ownerName) promptParts.push(`OWNER: ${req.prospect.ownerName}`);
  if (req.prospect.website) promptParts.push(`WEBSITE: ${req.prospect.website}`);
  promptParts.push(`WEBSITE QUALITY GRADE: ${req.prospect.quality}`);
  if (req.prospect.qualityIssues.length > 0) {
    promptParts.push(`OBSERVABLE ISSUES ON THEIR SITE (use at least one):`);
    for (const issue of req.prospect.qualityIssues) {
      promptParts.push(`  - ${issue}`);
    }
  }
  if (req.prospect.rating) {
    promptParts.push(`GOOGLE RATING: ${req.prospect.rating} (${req.prospect.reviewCount ?? 0} reviews)`);
  }
  if (req.senderName) promptParts.push(`\nSENDER NAME: ${req.senderName}`);
  if (req.senderCompany) promptParts.push(`SENDER COMPANY: ${req.senderCompany}`);
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
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" }, // cache the long system prompt across drafts
      },
    ],
    messages: [{ role: "user", content: userText }],
  });

  // Extract JSON from the response
  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  const raw = textBlock.text.trim();
  // The model may wrap JSON in ```json ... ``` fences; strip them.
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
