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
  { label: "Scorecard", href: "/", icon: "LayoutDashboard" as const },
  { label: "Meetings", href: "/meetings", icon: "CalendarDays" as const },
  { label: "Companies", href: "/companies", icon: "Building2" as const },
  { label: "AI Search", href: "/search", icon: "Search" as const },
  { label: "System", href: "/health", icon: "Activity" as const },
];

export const SUGGESTED_PROMPTS = [
  "What action items came from last week's internal meetings?",
  "Compare Tyler's meeting scores vs the team average",
  "What did we discuss with Consensus in our latest call?",
  "Show me all follow-up meetings with low engagement scores",
  "What are the open action items for FullFunnel?",
  "Which accounts need attention based on recent health scores?",
];
