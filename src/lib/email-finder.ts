/**
 * Email discovery — scrape a business's website for owner/contact emails.
 *
 * Visits the homepage plus common contact-y subpages (/contact, /about,
 * /team), parses HTML with cheerio, extracts mailto: links + plain-text
 * email matches, filters out obvious noise, and ranks candidates.
 *
 * Returns a ranked list of best-guess email addresses for the business.
 */
import { load as loadHtml } from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const TIMEOUT_MS = 10_000;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Emails that we know are NOT the business's contact email.
const BLOCKLIST_LOCAL = new Set([
  "no-reply",
  "noreply",
  "donotreply",
  "do-not-reply",
  "postmaster",
  "webmaster",
  "abuse",
  "privacy",
  "dmca",
  "press",
  "marketing",
  "support",
  "help",
  "wordpress",
  "example",
  "test",
  "user",
]);

// Domains that are clearly not the business's own (CDNs, common deps, etc.)
const BLOCKLIST_DOMAIN_PARTS = [
  "wixpress.com",
  "wix.com",
  "squarespace.com",
  "godaddy.com",
  "weebly.com",
  "shopify.com",
  "sentry.io",
  "wordpress.com",
  "wordpress.org",
  "gstatic.com",
  "googleapis.com",
  "google.com",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "youtube.com",
  "stripe.com",
  "intercom.com",
  "hubspot.com",
  "mailchimp.com",
  "constantcontact.com",
  "mailgun.org",
  "mailgun.net",
  "sendgrid.net",
  "amazonses.com",
  "example.com",
  "example.org",
  "test.com",
  "sentry-next.wixpress.com",
];

const CONTACT_PATHS = [
  "/contact",
  "/contact-us",
  "/contactus",
  "/about",
  "/about-us",
  "/aboutus",
  "/team",
];

export type EmailCandidate = {
  email: string;
  source: string; // URL where it was found
  score: number; // higher = more likely the right email
  rationale: string;
};

export type EmailFinderResult = {
  emails: EmailCandidate[];
  visitedUrls: string[];
  errors: string[];
};

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url) return "";
  if (!url.startsWith("http")) url = "https://" + url;
  try {
    return new URL(url).origin + new URL(url).pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const resp = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*;q=0.8" },
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const ct = resp.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) return null;
    return { html: await resp.text(), finalUrl: resp.url };
  } catch {
    return null;
  }
}

/** Deobfuscate common email obfuscations: "name AT domain DOT com" → name@domain.com */
function deobfuscate(text: string): string {
  return text
    .replace(/\s*\[\s*at\s*\]\s*/gi, "@")
    .replace(/\s*\(\s*at\s*\)\s*/gi, "@")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\s*\[\s*dot\s*\]\s*/gi, ".")
    .replace(/\s*\(\s*dot\s*\)\s*/gi, ".")
    .replace(/\s+dot\s+/gi, ".");
}

function extractEmailsFromHtml(html: string, websiteHost: string): string[] {
  const $ = loadHtml(html);
  const found = new Set<string>();

  // 1. mailto: hrefs (most reliable)
  $("a[href^='mailto:']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const email = href.replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase();
    if (email) found.add(email);
  });

  // 2. Plain-text matches in visible body
  const bodyText = $("body").text();
  const deobfuscated = deobfuscate(bodyText);
  const matches = deobfuscated.match(EMAIL_RE);
  if (matches) {
    for (const m of matches) found.add(m.toLowerCase());
  }

  // 3. Also pull from the full HTML in case it's hidden in attributes / data-*
  const htmlMatches = html.match(EMAIL_RE);
  if (htmlMatches) {
    for (const m of htmlMatches) found.add(m.toLowerCase());
  }

  void websiteHost; // not used directly here; scoring happens in caller
  return [...found];
}

function scoreEmail(email: string, websiteHost: string, source: string): { score: number; rationale: string } | null {
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;

  // Reject placeholder / image-encoded / clearly invalid
  if (local.length < 2 || domain.length < 4) return null;
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js)$/i.test(email)) return null;
  if (/^[0-9]+@/.test(email)) return null; // 12345@whatever — usually JS handler ids

  // Block-listed
  if (BLOCKLIST_LOCAL.has(local)) return null;
  for (const blocked of BLOCKLIST_DOMAIN_PARTS) {
    if (domain.endsWith(blocked)) return null;
  }

  let score = 50;
  const reasons: string[] = [];

  // Big boost if email is on the prospect's own domain
  const cleanHost = websiteHost.replace(/^www\./, "");
  const cleanDomain = domain.replace(/^www\./, "");
  if (cleanDomain === cleanHost || cleanDomain.endsWith("." + cleanHost) || cleanHost.endsWith("." + cleanDomain)) {
    score += 50;
    reasons.push("on the prospect's own domain");
  } else if (["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "icloud.com"].includes(cleanDomain)) {
    score += 25;
    reasons.push("personal email (Gmail/etc.)");
  } else {
    score += 10;
    reasons.push("external domain");
  }

  // Promote "owner-y" local parts
  const localLower = local.toLowerCase();
  if (/^(info|hello|hi|contact|sales|inquiries|inquiry|enquiries|enquiry|office)$/.test(localLower)) {
    score += 10;
    reasons.push("generic business inbox");
  } else if (/^(owner|founder|ceo|president|gm|manager|admin)$/.test(localLower)) {
    score += 30;
    reasons.push("decision-maker inbox");
  } else if (/^[a-z]+(\.|_)[a-z]+$/.test(localLower) || /^[a-z]+[a-z0-9]*$/.test(localLower)) {
    // looks like a real person's name
    score += 20;
    reasons.push("looks like a personal name");
  }

  // Boost if found via mailto: (vs scraped raw text)
  if (source.includes("mailto")) {
    score += 5;
    reasons.push("from mailto: link");
  }

  return { score, rationale: reasons.join("; ") || "found in page" };
}

export async function findEmailsForWebsite(websiteRaw: string): Promise<EmailFinderResult> {
  const result: EmailFinderResult = { emails: [], visitedUrls: [], errors: [] };

  if (!websiteRaw || !websiteRaw.trim()) {
    result.errors.push("No website to scan");
    return result;
  }

  const origin = normalizeUrl(websiteRaw);
  if (!origin) {
    result.errors.push("Invalid website URL");
    return result;
  }

  let host = "";
  try {
    host = new URL(origin).hostname;
  } catch {
    result.errors.push("Could not parse website hostname");
    return result;
  }

  // Build candidate URLs: homepage + a few common contact pages
  const baseOrigin = new URL(origin).origin;
  const urlsToTry = [
    origin,
    ...CONTACT_PATHS.map((p) => baseOrigin + p),
  ];

  const seen = new Map<string, EmailCandidate>();

  for (const url of urlsToTry) {
    const page = await fetchHtml(url);
    if (!page) continue;
    result.visitedUrls.push(page.finalUrl);

    const found = extractEmailsFromHtml(page.html, host);
    for (const email of found) {
      const sourceTag = page.finalUrl;
      const scored = scoreEmail(email, host, page.html.includes(`mailto:${email}`) ? sourceTag + " (mailto)" : sourceTag);
      if (!scored) continue;
      const prev = seen.get(email);
      if (!prev || scored.score > prev.score) {
        seen.set(email, {
          email,
          source: sourceTag,
          score: scored.score,
          rationale: scored.rationale,
        });
      }
    }

    // Stop early if we've found a high-confidence personal-domain email
    const best = [...seen.values()].sort((a, b) => b.score - a.score)[0];
    if (best && best.score >= 90) break;
  }

  result.emails = [...seen.values()].sort((a, b) => b.score - a.score).slice(0, 6);
  return result;
}
