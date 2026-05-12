export type ScoringStageType =
  | "discovery_scoping"
  | "follow_up"
  | "onboarding"
  | "client_meeting"
  | "internal_client_meeting"
  | "internal";

export const STAGE_CONFIG: Record<
  ScoringStageType,
  { label: string; color: string; bgClass: string; darkBgClass: string }
> = {
  discovery_scoping: {
    label: "Discovery",
    color: "blue",
    bgClass: "bg-[#146DFA]/10 text-[#146DFA]",
    darkBgClass: "dark:bg-[#146DFA]/20 dark:text-[#93b4f5]",
  },
  follow_up: {
    label: "Follow-Up",
    color: "slate",
    bgClass: "bg-[#0A0A0A]/8 text-[#0A0A0A]",
    darkBgClass: "dark:bg-white/10 dark:text-white/80",
  },
  onboarding: {
    label: "Onboarding",
    color: "blue",
    bgClass: "bg-[#146DFA]/5 text-[#146DFA]/80",
    darkBgClass: "dark:bg-[#146DFA]/10 dark:text-[#93b4f5]/80",
  },
  client_meeting: {
    label: "Check-In",
    color: "teal",
    bgClass: "bg-teal-100 text-teal-700",
    darkBgClass: "dark:bg-teal-900/30 dark:text-teal-400",
  },
  internal_client_meeting: {
    label: "Internal Check-In",
    color: "amber",
    bgClass: "bg-amber-50 text-amber-700",
    darkBgClass: "dark:bg-amber-900/20 dark:text-amber-400",
  },
  internal: {
    label: "Internal",
    color: "gray",
    bgClass: "bg-gray-100 text-gray-600",
    darkBgClass: "dark:bg-gray-800 dark:text-gray-400",
  },
};

export const SCORE_BANDS = {
  high: { min: 8, label: "Strong", color: "emerald" },
  medium: { min: 6, label: "Average", color: "yellow" },
  low: { min: 0, label: "Needs Work", color: "red" },
} as const;

export function getScoreBand(score: number | null) {
  if (score === null) return null;
  if (score >= 8) return SCORE_BANDS.high;
  if (score >= 6) return SCORE_BANDS.medium;
  return SCORE_BANDS.low;
}

// ── Analysis Sections ───────────────────────────
export type SectionKey = "all" | "sales" | "cs" | "internal";

export interface SectionConfig {
  label: string;
  shortLabel: string;
  stageTypes: ScoringStageType[];
  icon: "BarChart3" | "TrendingUp" | "HeartHandshake" | "Lock";
}

export const SECTIONS: Record<SectionKey, SectionConfig> = {
  all: {
    label: "All Analysis",
    shortLabel: "All",
    stageTypes: ["discovery_scoping", "follow_up", "onboarding", "client_meeting", "internal_client_meeting", "internal"],
    icon: "BarChart3",
  },
  sales: {
    label: "Sales Call Analysis",
    shortLabel: "Sales",
    stageTypes: ["discovery_scoping", "follow_up"],
    icon: "TrendingUp",
  },
  cs: {
    label: "Customer Success",
    shortLabel: "CS",
    stageTypes: ["onboarding", "client_meeting"],
    icon: "HeartHandshake",
  },
  internal: {
    label: "Internal Meetings",
    shortLabel: "Internal",
    stageTypes: ["internal", "internal_client_meeting"],
    icon: "Lock",
  },
};

export const SECTION_NAV_ITEMS = [
  { label: "Scorecard", href: "/", icon: "LayoutDashboard" as const },
  { label: "Meetings", href: "/meetings", icon: "CalendarDays" as const },
  { label: "Companies", href: "/companies", icon: "Building2" as const },
  { label: "Reps", href: "/reps", icon: "Users" as const },
  { label: "Ask Blarney", href: "/search", icon: "Search" as const },
];

export const NAV_ITEMS = [
  { label: "Scorecard", href: "/", icon: "LayoutDashboard" as const, group: "Analysis" },
  { label: "Meetings", href: "/meetings", icon: "CalendarDays" as const, group: "Analysis" },
  { label: "Companies", href: "/companies", icon: "Building2" as const, group: "Analysis" },
  { label: "Reps", href: "/reps", icon: "Users" as const, group: "Analysis" },
  { label: "Ask Blarney", href: "/search", icon: "Search" as const, group: "Tools" },
  { label: "System Health", href: "/health", icon: "Activity" as const, group: "Tools" },
];

export const SECTION_PROMPTS: Record<SectionKey, string[]> = {
  all: [
    "Compare all reps' average meeting scores",
    "Which accounts need attention based on recent health scores?",
    "What competitors were mentioned in recent calls?",
    "Show coaching insights for Tyler across all meetings",
    "What's the breakdown of meeting stages across all reps?",
    "What action items came from last week's meetings?",
  ],
  sales: [
    "Compare reps' discovery call scores",
    "Which prospects showed strong buying signals recently?",
    "Show ICP fit trends across recent discovery calls",
    "What competitors were mentioned in sales calls?",
    "Which follow-up meetings had declining deal sentiment?",
    "Show coaching insights for reps on discovery calls",
  ],
  cs: [
    "Which clients have declining health scores?",
    "Show onboarding progress across all accounts",
    "What blockers were raised in recent onboarding meetings?",
    "Which clients need immediate attention?",
    "Compare delivery scores across the CS team",
    "What milestones were discussed in recent check-ins?",
  ],
  internal: [
    "What action items came from recent team syncs?",
    "Show key decisions made this week",
    "Which clients were discussed in internal meetings?",
    "What are the open action items by owner?",
    "Summarize the major decisions from the last 7 days",
    "Which internal meetings had the highest productivity scores?",
  ],
};

// ── Sales Frameworks ────────────────────────────
export type FrameworkKey = "meddic" | "bant" | "spiced";

export interface FrameworkDimension {
  key: string;
  label: string;
  meddicKey: "metrics" | "economic_buyer" | "decision_criteria" | "decision_process" | "identify_pain" | "champion";
}

export interface FrameworkConfig {
  label: string;
  dimensions: FrameworkDimension[];
}

export const FRAMEWORKS: Record<FrameworkKey, FrameworkConfig> = {
  meddic: {
    label: "MEDDIC",
    dimensions: [
      { key: "metrics", label: "Metrics", meddicKey: "metrics" },
      { key: "economic_buyer", label: "Economic Buyer", meddicKey: "economic_buyer" },
      { key: "decision_criteria", label: "Decision Criteria", meddicKey: "decision_criteria" },
      { key: "decision_process", label: "Decision Process", meddicKey: "decision_process" },
      { key: "identify_pain", label: "Identify Pain", meddicKey: "identify_pain" },
      { key: "champion", label: "Champion", meddicKey: "champion" },
    ],
  },
  bant: {
    label: "BANT",
    dimensions: [
      { key: "budget", label: "Budget", meddicKey: "metrics" },
      { key: "authority", label: "Authority", meddicKey: "economic_buyer" },
      { key: "need", label: "Need", meddicKey: "identify_pain" },
      { key: "timeline", label: "Timeline", meddicKey: "decision_process" },
    ],
  },
  spiced: {
    label: "SPICED",
    dimensions: [
      { key: "situation", label: "Situation", meddicKey: "champion" },
      { key: "pain", label: "Pain", meddicKey: "identify_pain" },
      { key: "impact", label: "Impact", meddicKey: "metrics" },
      { key: "critical_event", label: "Critical Event", meddicKey: "decision_process" },
      { key: "decision", label: "Decision", meddicKey: "decision_criteria" },
    ],
  },
};

export const DISPLAY_FRAMEWORKS: FrameworkKey[] = ["bant", "meddic"];

// Vendors/tools to track in CLIENT meeting transcripts (excludes internal meetings)
// Excludes FullFunnel's own stack (Clay, HubSpot, HeyReach, Instantly) to focus
// on what prospects/clients are using or evaluating
export const TRACKED_VENDORS = [
  "Gong", "Chorus", "Salesloft", "Outreach", "Apollo",
  "6Sense", "6sense", "ZoomInfo", "Clari",
  "Salesforce", "Pardot", "Marketo", "Drift", "Intercom",
  "Definitive Healthcare", "Conversica",
  "Lemlist", "Lavender", "Regie", "Orum",
  "HubSpot", "Clay", "HeyReach", "Instantly",
];
