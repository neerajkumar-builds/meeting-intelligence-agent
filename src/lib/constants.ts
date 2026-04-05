export type ScoringStageType =
  | "discovery_scoping"
  | "follow_up"
  | "onboarding"
  | "internal";

export const STAGE_CONFIG: Record<
  ScoringStageType,
  { label: string; color: string; bgClass: string; darkBgClass: string }
> = {
  discovery_scoping: {
    label: "Discovery",
    color: "blue",
    bgClass: "bg-blue-100 text-blue-800",
    darkBgClass: "dark:bg-blue-900 dark:text-blue-300",
  },
  follow_up: {
    label: "Follow-Up",
    color: "purple",
    bgClass: "bg-purple-100 text-purple-800",
    darkBgClass: "dark:bg-purple-900 dark:text-purple-300",
  },
  onboarding: {
    label: "Onboarding",
    color: "green",
    bgClass: "bg-green-100 text-green-800",
    darkBgClass: "dark:bg-green-900 dark:text-green-300",
  },
  internal: {
    label: "Internal",
    color: "gray",
    bgClass: "bg-gray-100 text-gray-800",
    darkBgClass: "dark:bg-gray-800 dark:text-gray-300",
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

export const NAV_ITEMS = [
  { label: "Scorecard", href: "/", icon: "LayoutDashboard" as const, group: "Analysis" },
  { label: "Meetings", href: "/meetings", icon: "CalendarDays" as const, group: "Analysis" },
  { label: "Companies", href: "/companies", icon: "Building2" as const, group: "Analysis" },
  { label: "Reps", href: "/reps", icon: "Users" as const, group: "Analysis" },
  { label: "Ask Blarney", href: "/search", icon: "Search" as const, group: "Tools" },
  { label: "System Health", href: "/health", icon: "Activity" as const, group: "Tools" },
];

export const SUGGESTED_PROMPTS = [
  "Compare all reps' average meeting scores",
  "What action items came from last week's internal meetings?",
  "Which accounts need attention based on recent health scores?",
  "What competitors were mentioned in recent calls?",
  "Show coaching insights for Tyler across all meetings",
  "What's the breakdown of meeting stages across all reps?",
];

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
