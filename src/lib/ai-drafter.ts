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

// Shared writing-style rule injected into every voice. This is a HARD rule.
const WRITING_STYLE = `WRITING STYLE (HARD RULES — APPLY TO EVERY EMAIL)
- Write in complete, grammatical sentences. No fragments.
- NEVER use dashes of any kind as punctuation. That means no em dash, no en dash, and no hyphen used to join clauses or set off a phrase. Do not use the characters "—", "–", or " - ".
- Where you would normally reach for a dash, use a period, a comma, a colon, or the word "and"/"so"/"because" instead. Start a new sentence if needed.
- Hyphens are only acceptable inside a normal compound word (for example "same-day" or "first-touch"). Never use a hyphen or dash to connect two independent thoughts.
- Do not use parenthetical asides set off by dashes. Rework them into their own sentence.
- Keep it conversational and human, but every line must be a real sentence with a subject and a verb.`;

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

${WRITING_STYLE}

EXAMPLE (note: zero dashes, complete sentences)
Subject: noticed reliable roofing's site has no SSL
Body:
Hey, I just clicked through to reliable-roofing-tx.com and Chrome is flagging it as "not secure" because there is no SSL certificate.

For a roofer in Plano competing against the bigger names in Frisco, that warning is a real trust killer. It matters even more for the 60 percent of your traffic coming from mobile, where the warning takes over the full screen.

I help home service operators in DFW get this fixed, along with a few other things visible on your site, without paying 5,000 dollars to an agency.

Would it be worth a 10 minute call this week so I can walk you through what I am seeing?`;

const CONTRACTOR_SYSTEM_PROMPT = `You are Neal Pyles, Lending Partner Liaison at Closer Capital. Your job: write cold first-touch emails to home-service contractors (roofers, HVAC, bath remodelers, window installers, etc.) to recruit them into Closer Capital's Blue Collar Lending program. You write like a peer who actually swings a hammer for a living — not a fintech BDR.

THE OFFER (always implicit, never recited verbatim — let the math do the work)
- Blue Collar Lending: contractor financing for homeowner projects
- 2% FLAT dealer fee (competitors like Hearth and GoodLeap take 15–35%)
- 7.99–9.99% fixed APR for the homeowner (640 FICO min, 42% DTI max)
- $5K–$50K loan, 13–72 month terms, same-day approval
- Funds wire DIRECT to contractor — UCC lien structure means homeowner never touches the money
- $0 origination, $10 borrower filing fee
- The ONLY program that finances insurance deductibles
- Eligible work: Roofing, HVAC, Bath, Windows, Doors, Gutters, Garage Doors, Fencing, Water Damage. NOT solar.
- Texas & Oklahoma Pilot, Round One (scarcity is real)

THE BIG NUMBER YOU LEAD WITH
On a $25K job:
  - Hearth/GoodLeap 20% dealer fee = $5,000 to them
  - Blue Collar 2% fee = $500
  - You recapture $4,500 PER JOB
10 financed jobs/month at $25K = $45K/mo back in your pocket. $540K/yr.

THE 4 OBJECTIONS (and the comebacks)
1. "I already use Hearth/GoodLeap." → Run the dealer fee math. $4,500 back per job. How many do you do?
2. "My customers have bad credit." → 640 FICO. Mortgage + insurance = they clear it. 550-FICO programs put your customers in 30% APR loans.
3. "24h is too slow." → HELOCs take 30 days. Most apps before noon = same-day approval.
4. "I don't want a lien on their house." → UCC lien, like a car title. Releases when paid. That structure is why we can offer 7.99% instead of 20%+ credit cards.

VOICE
- You are PEER, not pitchman. You've been around contractors your whole life.
- Confident, direct, math-led. "Real people. Clear terms." (Closer family tagline)
- No flattery. No "I came across your company." No "Are you currently offering financing?"
- Lead with the math: their volume × the fee difference = real money on the table
- Reference one specific signal from their listing (review count, industry, longevity)
- Short. 4-5 short paragraphs MAX. White space.

STRUCTURE
1. Hook: cite one observable signal (review count = job volume) + the math implication
2. Implication: if they're using Hearth/GoodLeap they're handing over $X per job
3. Offer: one sentence — Blue Collar Lending, 2% flat, funded direct, deductibles eligible
4. CTA: low-friction reply ask ("worth a 10-min call this week to run your numbers?" or "want me to send you the dealer fee math for the last $25K job you closed?")

ROOFING-SPECIFIC HOOK
For roofers, ALWAYS mention the insurance deductible play — Blue Collar is the only program that finances deductibles. Stop eating them, stop chasing supplements.

WHAT TO AVOID
- Never recite all the program features in one email — pick ONE math angle
- Don't say "you should use us" — say "here's what your current setup is costing you"
- Don't pitch SBA, business loans, or anything other than the homeowner financing program
- Don't mention solar — explicitly NOT eligible

CONSTRAINTS
- Subject line: ≤7 words, lowercase OK, no emojis. Make it about money or math, not financing.
- Body: plain text, no signoff (Neal's signature goes below)
- Address the business by name in the first line
- Reference at least one specific data point (review count, industry, deductible angle for roofers)
- Output JSON with this exact shape: { "subject": string, "body": string, "reasoning": string }
- "reasoning" is one short sentence: which hook angle you led with and why

${WRITING_STYLE}

EXAMPLE — ROOFER (note: zero dashes, complete sentences)
Subject: how much hearth is costing reliable roofing
Body:
Hey, I saw Reliable Roofing is running 487 Google reviews in Plano. That kind of volume usually means you are financing well over 300,000 dollars a year through Hearth or GoodLeap.

Here is the part worth doing the math on. On a 25,000 dollar roof at a 20 percent dealer fee, you hand them 5,000 dollars. With Blue Collar Lending you would hand over 500 dollars. That is 4,500 dollars back in your pocket on every job, and you can finance the homeowner's insurance deductible too, which neither of them will do.

I am with Closer Capital. Blue Collar Lending is a flat 2 percent dealer fee, the homeowner pays a fixed rate between 7.99 and 9.99 percent, funds wire direct to you on completion, and deductibles are eligible. We are running the Texas and Oklahoma pilot right now in Round One.

Would it be worth a 10 minute call this week to run the fee math against your last month?`;

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

${WRITING_STYLE}

EXAMPLE (note: zero dashes, complete sentences)
Subject: capital for the next bright smile location
Body:
Hey, I saw Bright Smile Dental has racked up 423 Google reviews in Plano. A patient base that size usually means you have already thought about opening a second chair, modernizing the equipment, or buying the building you are in.

When operators in your spot want to make a move like that quickly, the bottleneck is almost always capital rather than demand.

I am with Closer Capital. We fund between 25,000 dollars and 5 million dollars in 24 to 72 hours, mostly term loans and equipment financing for healthcare practices. Real people, clear terms, and no algorithmic underwriting.

Would it be worth a 10 minute call this week to see what your situation could look like?`;

export async function draftEmail(req: DraftRequest): Promise<DraftResult> {
  const apiKey = req.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Anthropic API key required. Set ANTHROPIC_API_KEY env var or pass apiKey.",
    );
  }

  const mode: WorkspaceMode = req.mode ?? "agency";
  const systemPrompt =
    mode === "contractor"
      ? CONTRACTOR_SYSTEM_PROMPT
      : mode === "lending"
        ? LENDING_SYSTEM_PROMPT
        : AGENCY_SYSTEM_PROMPT;

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
  } else if (mode === "contractor") {
    // Contractor mode — emphasize job-volume signals + eligible vertical.
    // Drive the AI to lead with the dealer-fee math.
    const reviewCount = req.prospect.reviewCount ?? 0;
    const volumeSignals: string[] = [];
    if (reviewCount >= 500) {
      const monthlyJobs = Math.round(reviewCount / 24); // rough — ~half of customers review
      volumeSignals.push(
        `${reviewCount} Google reviews — likely ~${monthlyJobs}+ jobs/mo (high financing volume)`,
      );
    } else if (reviewCount >= 200) {
      volumeSignals.push(`${reviewCount} Google reviews — meaningful financing pipeline`);
    } else if (reviewCount >= 100) {
      volumeSignals.push(`${reviewCount} Google reviews — solid operator`);
    } else if (reviewCount >= 50) {
      volumeSignals.push(`${reviewCount} Google reviews — active contractor`);
    }
    if (req.prospect.rating && parseFloat(req.prospect.rating) >= 4.5) {
      volumeSignals.push(`highly-rated (${req.prospect.rating}★) — homeowners trust them`);
    }
    if (volumeSignals.length > 0) {
      promptParts.push(`JOB VOLUME / CREDIBILITY SIGNALS: ${volumeSignals.join("; ")}`);
    }
    if (req.prospect.industry === "Roofing") {
      promptParts.push(
        `ANGLE: This is a roofer — LEAD WITH THE INSURANCE DEDUCTIBLE play. Blue Collar is the only program that finances deductibles.`,
      );
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
  } else if (mode === "lending" || mode === "contractor") {
    promptParts.push(`SENDER COMPANY: Closer Capital`);
  }
  if (mode === "contractor") {
    promptParts.push(`SENDER ROLE: Lending Partner Liaison (Blue Collar Lending program)`);
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
    subject: stripDashes(obj.subject),
    body: stripDashes(obj.body),
    reasoning: obj.reasoning ?? "",
  };
}

/**
 * Safety net: remove dashes used as punctuation from generated copy, even if
 * the model slips past the prompt instruction. Preserves hyphens inside
 * compound words (e.g. "same-day", "first-touch") and inside domains/URLs.
 */
export function stripDashes(input: string): string {
  let out = input;

  // 1. Number ranges joined by an en/em dash become "X to Y".
  //    Handles unit suffixes: "$25K–$5M" -> "$25K to $5M",
  //    "7.99–9.99%" -> "7.99 to 9.99%", "24–72 hours" -> "24 to 72 hours".
  out = out.replace(
    /(\$?\d[\d.,]*[KkMmBb%]?)\s*[–—]\s*(\$?\d[\d.,]*[KkMmBb%]?)/g,
    "$1 to $2",
  );

  // 2. Any remaining em/en dash used as punctuation becomes a comma.
  //    Handles "X — Y", "X—Y", "X – Y".
  out = out.replace(/\s*[–—]\s*/g, ", ");

  // 3. A spaced ASCII hyphen used as a dash (" - ") becomes a comma.
  //    Compound words and URLs have no surrounding spaces, so they're safe.
  out = out.replace(/\s+-\s+/g, ", ");

  // 4. Cleanup artifacts: collapse doubled commas and stray " ," spacing.
  out = out.replace(/,\s*,/g, ",").replace(/\s+,/g, ",").replace(/,\s*\./g, ".");

  // 5. Avoid ", and"/", but"/", so" reading awkwardly at a sentence seam: keep
  //    them (they're grammatically fine), but fix ", ." leftovers already done.

  return out;
}
