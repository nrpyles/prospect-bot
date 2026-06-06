/**
 * Qualification scoring — computes a 0-100 "fit score" per prospect
 * along with the specific reasons they qualify, based on workspace mode.
 *
 * Agency mode rewards: bad website + alive business signals
 * Lending mode rewards: mature business + capital-ready signals
 */
import type { Prospect } from "./mock-prospects";
import type { WorkspaceMode, Quality } from "./pipeline";
import { BLUE_COLLAR_ELIGIBLE_INDUSTRIES } from "./pipeline";

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
  if (mode === "contractor") {
    if (band === "excellent") return "Prime Blue Collar Lending partner — eligible vertical, big volume, strong rep.";
    if (band === "strong") return "Strong contractor partner — likely paying Hearth/GoodLeap 20%+ today.";
    if (band === "decent") return "Worth a touch — eligible vertical but smaller operator.";
    if (band === "weak" && BLUE_COLLAR_ELIGIBLE_INDUSTRIES.has(p.industry)) {
      return "Eligible vertical but limited volume — low margin recapture.";
    }
    return "Not eligible for Blue Collar Lending program.";
  }
  if (mode === "agency") {
    if (band === "excellent") return "Textbook agency target — bad site, alive business.";
    if (band === "strong") return "Strong fit — clear website upside, healthy reputation.";
    if (band === "decent") return "Worth a touch — some signals, not perfect.";
    return "Marginal — site is fine or business is too early.";
  }
  if (band === "excellent") return "Prime lending candidate — mature, well-reviewed, capital-ready vertical.";
  if (band === "strong") return "Strong lending fit — established business with growth signals.";
  if (band === "decent") return "Worth a conversation — some maturity but not prime.";
  return "Too early — limited maturity signals.";
}

/**
 * Contractor mode: Closer Capital's Blue Collar Lending program.
 * Targets high-volume contractors in eligible verticals so Neal can recruit
 * them as financing partners (2% dealer fee vs 15-35% from Hearth/GoodLeap).
 *
 * Scoring weights HEAVILY toward:
 *  - Industry eligibility (Roofing/HVAC/Bath/Windows/Doors/Gutters/etc.)
 *  - Job volume signals (lots of reviews = lots of jobs = lots of 2% fees)
 *  - Credibility (rating ≥ 4.0 means homeowners trust them)
 */
function qualifyContractor(p: Prospect): FitVerdict {
  const reasons: FitReason[] = [];
  let score = 10; // low base — must earn it

  const eligible = BLUE_COLLAR_ELIGIBLE_INDUSTRIES.has(p.industry);

  if (eligible) {
    // Massive boost for eligible verticals — these are THE target industries.
    let industryPoints = 30;
    let industryLabel = `Blue Collar Lending eligible (${p.industry})`;

    // Bonuses for highest-value verticals (where 2% fee math is most painful)
    if (p.industry === "Roofing") {
      industryPoints = 38;
      industryLabel = `Roofing — deductible play + storm-driven demand`;
    } else if (p.industry === "HVAC") {
      industryPoints = 36;
      industryLabel = `HVAC — financing closes more $10K+ jobs`;
    } else if (p.industry === "Bath Remodel") {
      industryPoints = 34;
      industryLabel = `Bath Remodel — average ticket fits perfectly in $5K–$50K`;
    } else if (p.industry === "Window Installation") {
      industryPoints = 32;
      industryLabel = `Window Installation — high-ticket Hearth competitor`;
    }

    reasons.push({
      label: industryLabel,
      points: industryPoints,
      category: "industry",
      sign: "+",
    });
    score += industryPoints;
  } else {
    // Hard penalty — non-eligible industries should rarely show up here
    reasons.push({
      label: `Not eligible for Blue Collar Lending (${p.industry})`,
      points: -30,
      category: "industry",
      sign: "-",
    });
    score -= 30;
  }

  // Job volume — proxy for how much 2% fee margin Neal recaptures.
  // Reviews → jobs done → likely current financing volume.
  const rc = p.reviewCount ?? 0;
  if (rc >= 500) {
    reasons.push({
      label: `Massive volume (${rc} reviews — likely $500K+/yr in financed work)`,
      points: 30,
      category: "reviews",
      sign: "+",
    });
    score += 30;
  } else if (rc >= 200) {
    reasons.push({
      label: `High volume (${rc} reviews — strong financing pipeline)`,
      points: 22,
      category: "reviews",
      sign: "+",
    });
    score += 22;
  } else if (rc >= 100) {
    reasons.push({
      label: `Solid operator (${rc} reviews)`,
      points: 14,
      category: "reviews",
      sign: "+",
    });
    score += 14;
  } else if (rc >= 50) {
    reasons.push({
      label: `Active contractor (${rc} reviews)`,
      points: 8,
      category: "reviews",
      sign: "+",
    });
    score += 8;
  } else if (rc < 20) {
    reasons.push({
      label: `Low job volume (${rc} reviews — not enough margin to recapture)`,
      points: -8,
      category: "reviews",
      sign: "-",
    });
    score -= 8;
  }

  // Credibility — homeowners need to trust them for financing to convert.
  const rating = parseRating(p.rating);
  if (rating !== null) {
    if (rating >= 4.7) {
      reasons.push({
        label: `Top-tier reputation (${rating}★) — homeowners will trust the upsell`,
        points: 12,
        category: "rating",
        sign: "+",
      });
      score += 12;
    } else if (rating >= 4.5) {
      reasons.push({
        label: `Strong reputation (${rating}★)`,
        points: 8,
        category: "rating",
        sign: "+",
      });
      score += 8;
    } else if (rating >= 4.0) {
      reasons.push({
        label: `Solid reputation (${rating}★)`,
        points: 4,
        category: "rating",
        sign: "+",
      });
      score += 4;
    } else if (rating < 3.5) {
      reasons.push({
        label: `Reputation risk (${rating}★) — harder financing close`,
        points: -10,
        category: "rating",
        sign: "-",
      });
      score -= 10;
    }
  }

  // Has website — signals professional operation worth partnering with
  if (p.website && p.quality !== "No Website") {
    reasons.push({
      label: "Professional setup (has website)",
      points: 4,
      category: "maturity",
      sign: "+",
    });
    score += 4;
  }

  // Contact details
  if (p.phone) {
    reasons.push({
      label: "Phone visible — easy partner outreach",
      points: 3,
      category: "contact",
      sign: "+",
    });
    score += 3;
  }
  if (p.email) {
    reasons.push({
      label: "Direct email found — fast partner pitch",
      points: 5,
      category: "contact",
      sign: "+",
    });
    score += 5;
  }

  const finalScore = clamp(score);
  const band = bandFor(finalScore);
  const headline = headlineFor(p, band, "contractor");

  return { score: finalScore, band, headline, reasons };
}

export function qualifyProspect(p: Prospect, mode: WorkspaceMode): FitVerdict {
  if (mode === "contractor") return qualifyContractor(p);
  if (mode === "lending") return qualifyLending(p);
  return qualifyAgency(p);
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
