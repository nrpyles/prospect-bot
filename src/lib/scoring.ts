/**
 * Website quality scorer — TypeScript port of
 * prospect-bot/prospect-finder-v2.py::check_website_quality
 *
 * Fetches a URL, parses the HTML, and returns a quality bucket
 * + a list of human-readable issues.
 */
import { load as loadHtml } from "cheerio";
import type { Quality } from "./pipeline";

export type ScoreResult = {
  quality: Quality;
  issues: string[];
  score: number;
};

const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const TIMEOUT_MS = 10_000;

const FORM_INDICATORS = [
  "typeform", "jotform", "tally", "formspree", "hubspot", "calendly",
];

const BUILDERS: Array<[string, string]> = [
  ["wix.com", "Built on Wix"],
  ["squarespace.com", "Built on Squarespace"],
  ["weebly.com", "Built on Weebly"],
  ["godaddy.com", "GoDaddy builder"],
];

const PHONE_RE = /[(]?\d{3}[)]?[\s\-.]?\d{3}[\s\-.]?\d{4}/;

export async function checkWebsiteQuality(url: string | undefined | null): Promise<ScoreResult> {
  if (!url || !url.trim()) {
    return { quality: "No Website", issues: ["No website found"], score: 0 };
  }

  let normalized = url.trim();
  if (!normalized.startsWith("http")) normalized = "https://" + normalized;

  let html = "";
  let finalUrl = normalized;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const response = await fetch(normalized, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    clearTimeout(timer);
    finalUrl = response.url;

    if (!response.ok) {
      return {
        quality: "Terrible",
        issues: [`Site returns ${response.status} error`],
        score: 0,
      };
    }
    html = await response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("timeout")) {
      return { quality: "Terrible", issues: ["Site timed out (>10s load time)"], score: 0 };
    }
    return { quality: "Terrible", issues: [`Site failed to load: ${msg.slice(0, 80)}`], score: 0 };
  }

  const $ = loadHtml(html);
  const issues: string[] = [];
  let score = 100;
  const lowerHtml = html.toLowerCase();

  if (html.length < 2000) {
    issues.push("Extremely thin content");
    score -= 30;
  }

  if ($("meta[name='viewport']").length === 0) {
    issues.push("No mobile viewport tag");
    score -= 25;
  }

  const title = $("title").first().text()?.trim();
  if (!title || title.length < 5) {
    issues.push("Missing or empty page title");
    score -= 15;
  }

  if ($("meta[name='description']").length === 0) {
    issues.push("No meta description");
    score -= 10;
  }

  if ($("h1").length === 0) {
    issues.push("No H1 heading");
    score -= 10;
  }

  const hasForm =
    $("form").length > 0 ||
    FORM_INDICATORS.some((ind) => lowerHtml.includes(ind));
  if (!hasForm) {
    issues.push("No lead capture form found");
    score -= 20;
  }

  if (!PHONE_RE.test(html)) {
    issues.push("No visible phone number");
    score -= 10;
  }

  if (!finalUrl.startsWith("https")) {
    issues.push("No SSL/HTTPS");
    score -= 15;
  }

  for (const [needle, label] of BUILDERS) {
    if (lowerHtml.includes(needle) || finalUrl.toLowerCase().includes(needle)) {
      issues.push(label);
      score -= 5;
      break;
    }
  }

  if (/copyright 20(18|19|20|21)/i.test(lowerHtml)) {
    issues.push("Copyright date is years old");
    score -= 10;
  }

  let quality: Quality;
  if (score >= 80) quality = "Good";
  else if (score >= 60) quality = "Decent";
  else if (score >= 35) quality = "Outdated";
  else quality = "Terrible";

  return { quality, issues, score };
}
