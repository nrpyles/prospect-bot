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

export const WORKSPACE_MODES = ["agency", "lending", "contractor"] as const;
export type WorkspaceMode = (typeof WORKSPACE_MODES)[number];

/**
 * Master list of small business industries. ~90 types covering both
 * the marketing-agency ICP (home services) and the business-lending
 * ICP (mature small businesses needing capital).
 */
export const INDUSTRIES = [
  // ── Home services (Marketing Agency mode) ──
  "Roofing",
  "HVAC",
  "Fencing",
  "Plumbing",
  "Landscaping",
  "Garage Doors",
  "Auto Detailing",
  "Pest Control",
  "Concrete",
  "Pool Builder",
  "Painting",
  "Electrical",
  "Tree Service",
  "Pressure Washing",
  "Flooring",
  "Window Cleaning",
  "Moving",
  "Junk Removal",
  "Solar Installation",
  "Carpet Cleaning",
  "Restoration",
  "Mold Remediation",
  "Bath Remodel",
  "Window Installation",
  "Door Installation",
  "Gutter Installation",

  // ── Food & Beverage ──
  "Restaurant",
  "Cafe",
  "Bakery",
  "Catering",
  "Bar",
  "Food Truck",
  "Liquor Store",

  // ── Beauty & Wellness ──
  "Hair Salon",
  "Barbershop",
  "Nail Salon",
  "Med Spa",
  "Massage",
  "Tattoo Shop",

  // ── Fitness ──
  "Gym",
  "Yoga Studio",
  "Pilates Studio",
  "Personal Training",
  "Martial Arts",
  "Dance Studio",

  // ── Auto ──
  "Auto Repair",
  "Body Shop",
  "Tire Shop",
  "Car Wash",
  "Car Dealership",
  "Auto Parts",

  // ── Childcare & Education ──
  "Daycare",
  "Preschool",
  "Tutoring",
  "Music School",
  "Driving School",

  // ── Pets ──
  "Veterinary",
  "Pet Grooming",
  "Pet Boarding",
  "Dog Trainer",

  // ── Health & Medical ──
  "Dentist",
  "Orthodontist",
  "Optometry",
  "Chiropractor",
  "Physical Therapy",
  "Acupuncture",
  "Mental Health",
  "Medical Clinic",
  "Pharmacy",

  // ── Professional Services ──
  "Insurance Agency",
  "Real Estate",
  "Mortgage Broker",
  "Law Firm",
  "Accounting",
  "Bookkeeping",
  "Tax Prep",
  "Wedding Planner",
  "Travel Agency",
  "Photography",
  "Event Venue",

  // ── Retail ──
  "Florist",
  "Boutique",
  "Furniture Store",
  "Jewelry Store",
  "Sporting Goods",
  "Hardware Store",
  "Garden Center",
  "Bookstore",
  "Smoke Shop",
  "Convenience Store",

  // ── Construction & Trades ──
  "General Contractor",
  "Commercial Construction",
  "Remodeling",
  "Carpentry",
  "Welding",
  "Locksmith",

  // ── Logistics & B2B ──
  "Trucking",
  "Delivery Service",
  "Janitorial",
  "Cleaning Service",
  "Print Shop",
  "Sign Shop",
  "Manufacturing",
  "Wholesale",
  "Funeral Home",

  "Other",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

/** Preset industry picks per workspace mode. */
export const INDUSTRY_PRESETS: Record<WorkspaceMode, { label: string; industries: Industry[] }> = {
  agency: {
    label: "Home services (bad-website ICP)",
    industries: [
      "Roofing", "HVAC", "Fencing", "Plumbing", "Landscaping",
      "Garage Doors", "Pool Builder", "Med Spa", "Dentist", "Pest Control",
      "Concrete", "Painting", "Electrical", "Tree Service", "Pressure Washing",
      "Flooring", "Window Cleaning", "Solar Installation", "Restoration", "Auto Detailing",
    ],
  },
  lending: {
    label: "Mature SMBs (lending ICP)",
    industries: [
      "Restaurant", "Cafe", "Bakery", "Hair Salon", "Barbershop",
      "Nail Salon", "Med Spa", "Gym", "Auto Repair", "Body Shop",
      "Veterinary", "Daycare", "Florist", "Liquor Store", "Convenience Store",
      "Boutique", "Furniture Store", "Jewelry Store", "Print Shop", "Tattoo Shop",
      "Dentist", "Chiropractor", "Optometry", "Insurance Agency", "Real Estate",
    ],
  },
  contractor: {
    label: "Blue Collar Lending eligible contractors",
    industries: [
      "Roofing", "HVAC", "Bath Remodel", "Window Installation", "Door Installation",
      "Gutter Installation", "Garage Doors", "Fencing", "Restoration", "Remodeling",
      "General Contractor",
    ],
  },
};

/** Industries eligible for Blue Collar Lending financing (page 1 of playbook). */
export const BLUE_COLLAR_ELIGIBLE_INDUSTRIES: ReadonlySet<Industry> = new Set([
  "Roofing",
  "HVAC",
  "Bath Remodel",
  "Window Installation",
  "Door Installation",
  "Gutter Installation",
  "Garage Doors",
  "Fencing",
  "Restoration",
  "Remodeling",
  "General Contractor",
]);

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
