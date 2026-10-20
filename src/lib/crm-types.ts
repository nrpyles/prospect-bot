export type DiscoverySource = "google" | "facebook" | "craigslist";
export type WebsiteState = "missing" | "inspected" | "unavailable" | "unchecked";
export type OfferType = "website_build" | "website_refresh" | "seo_improvements" | "website_plus_seo";
export type OutreachDisposition = "active" | "replied" | "not_interested" | "do_not_contact";
export type SendIntentState = "prepared" | "sending" | "sent" | "unknown" | "failed" | "cancelled";
export type Evidence = {
  id: string; source: DiscoverySource; url: string; query: string; observedAt: string;
  publishedAt: string | null; verifiedAt: string | null;
  freshness: "unknown" | "current" | "stale" | "unavailable";
  snippet: string; verifiedFields: string[];
};
export type Finding = {
  id: string; category: "website" | "on_page_seo" | "local_visibility";
  code: string; title: string; evidence: string; url: string; checkedAt: string;
  confidence: "observed" | "needs_review"; suggestion: string;
};
export type AuditResult = {
  websiteUrl?: string | null;state: WebsiteState; findings: Finding[]; checksRun: string[]; checksNotRun: string[]; errorCode?: string};
export type Candidate = {
  id: string; displayTitle: string; businessName: string | null; city: string; industry: string;
  website: string | null; phone: string | null; email: string | null; placeId: string | null;
  rating?: string; reviewCount?: number; address?: string;
  providerStatus: "provider" | "homeowner_request" | "unknown";
  evidence: Evidence[]; reviewRequired: boolean;
};
export type SearchJobConfig = {
  cities: string[]; industries: string[]; sources: DiscoverySource[];
  qualityFilter: string[] | null; maxResultsPerQuery: number; maxCandidates: number; maxUnits: number;
};
export type JobState = "queued" | "running" | "partial" | "complete" | "failed" | "cancelled";
export type JobSummary = {id: string; state: JobState; createdAt: string; heartbeatAt: string | null;
  foundCount: number; addedCount: number; reviewCount: number; completedUnits: number; totalUnits: number;
  warnings: string[]; sources: {source: DiscoverySource; state: string; error?: string}[]};
export const OFFER_LABELS: Record<OfferType, string> = {
  website_build: "Website build", website_refresh: "Website refresh", seo_improvements: "SEO improvements", website_plus_seo: "Website + SEO",
};
export function normalizeResearch<T extends Record<string, unknown>>(row: T) {
  const states = ["missing", "inspected", "unavailable", "unchecked"];
  return {...row, researchState: (states.includes(typeof row.researchState === "string" ? row.researchState : "") ? row.researchState : "unchecked") as WebsiteState,
    offerType: (typeof row.offerType === "string" && row.offerType in OFFER_LABELS ? row.offerType : null) as OfferType | null};
}
