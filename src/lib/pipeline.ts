/**
 * Pipeline constants — ported from prospect-bot/dashboard.py
 * Single source of truth for stages, statuses, and brand colors.
 */

export const STATUSES = [
  "New Lead",
  "Email Sent",
  "DM Sent",
  "Text Sent",
  "Called",
  "Follow Up 1",
  "Follow Up 2",
  "Breakup Sent",
  "Interested",
  "Call Scheduled",
  "Proposal Sent",
  "Closed Won",
  "Closed Lost",
  "Not Interested",
] as const;
export type Status = (typeof STATUSES)[number];

export const QUALITIES = [
  "No Website",
  "Terrible",
  "Outdated",
  "Decent",
  "Good",
] as const;
export type Quality = (typeof QUALITIES)[number];

export const INDUSTRIES = [
  "Roofing", "HVAC", "Fencing", "Plumbing", "Landscaping", "Garage Doors",
  "Auto Detailing", "Med Spa", "Dentist", "Pest Control", "Concrete",
  "Pool Builder", "Painting", "Electrical", "Tree Service", "Pressure Washing",
  "Flooring", "Window Cleaning", "Moving", "Junk Removal", "Other",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const SOURCES = [
  "Google Maps Bot", "Google Maps", "Facebook Group", "Google Page 2",
  "Yelp", "Thumbtack", "Nextdoor", "Drive By", "County Filing",
  "Referral", "Cold Search", "Other",
] as const;
export type Source = (typeof SOURCES)[number];

export type Stage = {
  key: string;
  label: string;
  statuses: Status[];
  accent: string;
};

export const STAGES: Stage[] = [
  { key: "new", label: "New Leads", statuses: ["New Lead"], accent: "#6366F1" },
  {
    key: "outreach",
    label: "Outreach",
    statuses: ["Email Sent", "DM Sent", "Text Sent", "Called"],
    accent: "#3B82F6",
  },
  {
    key: "followup",
    label: "Follow Up",
    statuses: ["Follow Up 1", "Follow Up 2", "Breakup Sent"],
    accent: "#F59E0B",
  },
  {
    key: "warm",
    label: "Warm",
    statuses: ["Interested", "Call Scheduled"],
    accent: "#22C55E",
  },
  {
    key: "closing",
    label: "Closing",
    statuses: ["Proposal Sent"],
    accent: "#F97316",
  },
  {
    key: "won",
    label: "Closed Won",
    statuses: ["Closed Won"],
    accent: "#10B981",
  },
];

export const STATUS_COLORS: Record<Status, string> = {
  "New Lead": "#6366F1",
  "Email Sent": "#3B82F6",
  "DM Sent": "#3B82F6",
  "Text Sent": "#3B82F6",
  "Called": "#8B5CF6",
  "Follow Up 1": "#F59E0B",
  "Follow Up 2": "#F59E0B",
  "Breakup Sent": "#EF4444",
  "Interested": "#22C55E",
  "Call Scheduled": "#22C55E",
  "Proposal Sent": "#F97316",
  "Closed Won": "#10B981",
  "Closed Lost": "#64748B",
  "Not Interested": "#64748B",
};

export const QUALITY_COLORS: Record<Quality, string> = {
  "No Website": "#EF4444",
  "Terrible": "#F97316",
  "Outdated": "#F59E0B",
  "Decent": "#3B82F6",
  "Good": "#22C55E",
};

/** Default status when a stage is dropped on (first status in stage list). */
export function getDefaultStatusForStage(stageKey: string): Status {
  const stage = STAGES.find((s) => s.key === stageKey);
  return stage?.statuses[0] ?? "New Lead";
}

export function getStageForStatus(status: Status): Stage | undefined {
  return STAGES.find((s) => s.statuses.includes(status));
}
