/**
 * Qualification scoring — computes a 0-100 "fit score" per prospect
 * along with the specific reasons they qualify, based on workspace mode.
 *
 * Agency mode rewards: bad website + alive business signals
 * Lending mode rewards: mature business + capital-ready signals
 */
import type { Prospect } from "./mock-prospects";
import type { WorkspaceMode, Quality } from "./pipeline";

export type FitReason = {
  /** Human-readable label, e.g. "Excellent reviews (312)". */
  label: string;
  /** Points contributed to the total. */
  points: number;
  /** Category for grouping / icon: 'website' | 'reviews' | 'rating' | 'industry' | 'maturity' | 'contact' */
  category: "website" | "reviews" | "rating" | "industry" | "maturity" | "contact";
  /** "+" for a positive reason, "−" for a deduction, "?" for neutral. */
  sign: "+" | "-" | "?";
};

export type FitVerdict = {
  score: number; // 0-100 (clamped)
  band: "weak" | "decent" | "strong" | "excellent";
  headline: string; // one-line summary
  reasons: FitReason[];
};

// High-value industries where lending originators / agencies pay best.
const HIGH_VALUE_AGENCY = new Set([
  "Roofing", "HVAC", "Pool Builder", "Med Spa", "Dentist",
  "Solar Installation", "Garage Doors", "Concrete", "Restoration",
]);

const HIGH_CASH_FLOW_LENDING = new Set([
  "Restaurant", "Cafe", "Bakery", "Bar", "Catering",
  "Hair Salon", "Barbershop", "Nail Salon", "Med Spa", "Massage",
  "Gym", "Yoga Studio", "Pilates Studio",
  "Auto Repair", "Body Shop", "Tire Shop", "Car Wash",
  "Daycare", "Preschool", "Tutoring",
  "Veterinary", "Pet Grooming",
  "Dentist", "Orthodontist", "Chiropractor", "Optometry",
  "Liquor Store", "Convenience Store",
  "Boutique", "Furniture Store", "Jewelry Store",
  "Florist", "Tattoo Shop",
  "Print Shop", "Sign Shop",
  "General Contractor", "Remodeling", "Trucking", "Manufacturing",
]);

const QUALITY_AGENCY_POINTS: Record<Quality, number> = {
  "No Website": 30, // strongest signal — they need everything
  "Terrible": 28,
  "Outdated": 18,
  "Decent": 4,
  "Good": -10, // they don't need an agency
};

function bandFor(score: number): FitVerdict["band"] {
  if (score >= 80) return "excellent";
  if (score >= 60) return "strong";
  if (score >= 40) return "decent";
  return "weak";
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function parseRating(r?: string): number | null {
  if (!r) return null;
  const n = parseFloat(r);
  return isNaN(n) ? null : n;
}

/** Agency mode: bad website + healthy Google presence = ideal target. */
function qualifyAgency(p: Prospect): FitVerdict {
  const reasons: FitReason[] = [];
  let score = 30; // base

  // Website quality is THE signal for agency mode.
  const qualityPoints = QUALITY_AGENCY_POINTS[p.quality];
  if (qualityPoints !== 0) {
    reasons.push({
      label:
        p.quality === "No Website"
          ? "No website at all — needs everything"
          : p.quality === "Terrible"
            ? "Terrible website — easy to upgrade"
            : p.quality === "Outdated"
              ? "Outdated website — clear room to improve"
              : p.quality === "Decent"
                ? "Decent website — limited upside"
                : "Good website — already handled",
      points: qualityPoints,
      category: "website",
      sign: qualityPoints > 0 ? "+" : qualityPoints < 0 ? "-" : "?",
    });
    score += qualityPoints;
  }

  // Specific website issues each add small value
  if (p.qualityIssues.length > 0) {
    const issuePoints = Math.min(p.qualityIssues.length * 2, 12);
    reasons.push({
      label: `${p.qualityIssues.length} fixable issue${p.qualityIssues.length === 1 ? "" : "s"} on their site`,
      points: issuePoints,
      category: "website",
      sign: "+",
    });
    score += issuePoints;
  }

  // Reviews signal that the business is alive and customers find them.
  const rc = p.reviewCount ?? 0;
  if (rc >= 200) {
    reasons.push({ label: `Strong customer base (${rc} reviews)`, points: 20, category: "reviews", sign: "+" });
    score += 20;
  } else if (rc >= 100) {
    reasons.push({ label: `Healthy review count (${rc} reviews)`, points: 14, category: "reviews", sign: "+" });
    score += 14;
  } else if (rc >= 50) {
    reasons.push({ label: `Active business (${rc} reviews)`, points: 8, category: "reviews", sign: "+" });
    score += 8;
  } else if (rc >= 20) {
    reasons.push({ label: `Some traction (${rc} reviews)`, points: 4, category: "reviews", sign: "+" });
    score += 4;
  } else if (rc > 0 && rc < 10) {
    reasons.push({ label: `Low review count (${rc})`, points: -4, category: "reviews", sign: "-" });
    score -= 4;
  }

  // Rating quality
  const rating = parseRating(p.rating);
  if (rating !== null) {
    if (rating >= 4.5) {
      reasons.push({ label: `Excellent reputation (${rating}★)`, points: 8, category: "rating", sign: "+" });
      score += 8;
    } else if (rating >= 4.0) {
      reasons.push({ label: `Good reputation (${rating}★)`, points: 4, category: "rating", sign: "+" });
      score += 4;
    } else if (rating < 3.5) {
      reasons.push({ label: `Lower rating (${rating}★)`, points: -6, category: "rating", sign: "-" });
      score -= 6;
    }
  }

  // Industry — agency-friendly verticals
  if (HIGH_VALUE_AGENCY.has(p.industry)) {
    reasons.push({
      label: `High-value vertical (${p.industry})`,
      points: 6,
      category: "industry",
      sign: "+",
    });
    score += 6;
  }

  // Visible phone number — they take calls (good closer signal)
  if (p.phone) {
    reasons.push({ label: "Phone number visible — they answer", points: 3, category: "contact", sign: "+" });
    score += 3;
  }

  // Direct email already discovered
  if (p.email) {
    reasons.push({ label: "Direct email found — easy reach", points: 4, category: "contact", sign: "+" });
    score += 4;
  }

  const finalScore = clamp(score);
  const band = bandFor(finalScore);
  const headline = headlineFor(p, band, "agency");

  return { score: finalScore, band, headline, reasons };
}

/** Lending mode: mature business + revenue signals = capital-ready. */
function qualifyLending(p: Prospect): FitVerdict {
  const reasons: FitReason[] = [];
  let score = 20; // base

  // Maturity (reviews are a proxy for time in market + customer volume)
  const rc = p.reviewCount ?? 0;
  if (rc >= 500) {
    reasons.push({ label: `Very mature (${rc} reviews — multi-year operator)`, points: 35, category: "maturity", sign: "+" });
    score += 35;
  } else if (rc >= 200) {
    reasons.push({ label: `Established (${rc} reviews — capital-ready scale)`, points: 28, category: "maturity", sign: "+" });
    score += 28;
  } else if (rc >= 100) {
    reasons.push({ label: `Solid base (${rc} reviews)`, points: 18, category: "maturity", sign: "+" });
    score += 18;
  } else if (rc >= 50) {
    reasons.push({ label: `Growing (${rc} reviews)`, points: 10, category: "maturity", sign: "+" });
    score += 10;
  } else if (rc < 20) {
    reasons.push({ label: `Early stage (${rc} reviews — may be too young)`, points: -10, category: "maturity", sign: "-" });
    score -= 10;
  }

  // Rating (high rating = well-run business, lower default risk)
  const rating = parseRating(p.rating);
  if (rating !== null) {
    if (rating >= 4.7) {
      reasons.push({ label: `Top-tier reputation (${rating}★)`, points: 18, category: "rating", sign: "+" });
      score += 18;
    } else if (rating >= 4.5) {
      reasons.push({ label: `Strong reputation (${rating}★)`, points: 12, category: "rating", sign: "+" });
      score += 12;
    } else if (rating >= 4.0) {
      reasons.push({ label: `Decent reputation (${rating}★)`, points: 6, category: "rating", sign: "+" });
      score += 6;
    } else if (rating < 3.5) {
      reasons.push({ label: `Reputation risk (${rating}★ — may impact underwriting)`, points: -10, category: "rating", sign: "-" });
      score -= 10;
    }
  }

  // Industry — cash-flow-positive verticals for lending
  if (HIGH_CASH_FLOW_LENDING.has(p.industry)) {
    reasons.push({
      label: `Strong vertical for capital (${p.industry})`,
      points: 12,
      category: "industry",
      sign: "+",
    });
    score += 12;
  }

  // Has a website = operational maturity
  if (p.website && p.quality !== "No Website") {
    reasons.push({ label: "Operational maturity (has website)", points: 4, category: "maturity", sign: "+" });
    score += 4;
  }

  // Contact details available
  if (p.phone) {
    reasons.push({ label: "Phone visible — easy to reach", points: 3, category: "contact", sign: "+" });
    score += 3;
  }
  if (p.email) {
    reasons.push({ label: "Direct email found", points: 4, category: "contact", sign: "+" });
    score += 4;
  }

  const finalScore = clamp(score);
  const band = bandFor(finalScore);
  const headline = headlineFor(p, band, "lending");

  return { score: finalScore, band, headline, reasons };
}

function headlineFor(p: Prospect, band: FitVerdict["band"], mode: WorkspaceMode): string {
  if (mode === "agency") {
    if (band === "excellent") return "Textbook agency target — bad site, alive business.";
    if (band === "strong") return "Strong fit — clear website upside, healthy reputation.";
    if (band === "decent") return "Worth a touch — some signals, not perfect.";
    return "Marginal — site is fine or business is too early.";
  } else {
    if (band === "excellent") return "Prime lending candidate — mature, well-reviewed, capital-ready vertical.";
    if (band === "strong") return "Strong lending fit — established business with growth signals.";
    if (band === "decent") return "Worth a conversation — some maturity but not prime.";
    return "Too early — limited maturity signals.";
  }
}

export function qualifyProspect(p: Prospect, mode: WorkspaceMode): FitVerdict {
  return mode === "lending" ? qualifyLending(p) : qualifyAgency(p);
}

export const BAND_COLOR: Record<FitVerdict["band"], string> = {
  excellent: "var(--color-status-won)",
  strong: "var(--color-status-warm)",
  decent: "var(--color-status-followup)",
  weak: "var(--color-foreground-muted)",
};

export const BAND_LABEL: Record<FitVerdict["band"], string> = {
  excellent: "EXCELLENT FIT",
  strong: "STRONG FIT",
  decent: "DECENT FIT",
  weak: "WEAK FIT",
};
