import { type ScoringStageType, STAGE_CONFIG } from "@/lib/constants";

export function getStageLabel(stage: string | null): string {
  if (!stage) return "Unknown";
  return STAGE_CONFIG[stage as ScoringStageType]?.label ?? "Unknown";
}

export function getStageColor(stage: string | null): string {
  if (!stage) return "gray";
  return STAGE_CONFIG[stage as ScoringStageType]?.color ?? "gray";
}

export function getStageBgClass(stage: string | null): string {
  if (!stage) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  const config = STAGE_CONFIG[stage as ScoringStageType];
  if (!config) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  return `${config.bgClass} ${config.darkBgClass}`;
}

/** Score fields available per stage type */
export const STAGE_SCORE_FIELDS: Record<
  ScoringStageType,
  { field: string; label: string }[]
> = {
  discovery_scoping: [
    { field: "meeting_score", label: "Meeting Outcome" },
    { field: "rep_score", label: "Rep Performance" },
    { field: "icp_score", label: "ICP Fit" },
  ],
  follow_up: [
    { field: "engagement_score", label: "Engagement" },
    { field: "rep_score", label: "Rep Performance" },
    { field: "client_health_score", label: "Account Health" },
  ],
  onboarding: [
    { field: "delivery_score", label: "Delivery" },
    { field: "rep_score", label: "Rep Performance" },
    { field: "client_health_score", label: "Client Satisfaction" },
  ],
  internal: [
    { field: "internal_summary", label: "Meeting Quality" },
  ],
};
