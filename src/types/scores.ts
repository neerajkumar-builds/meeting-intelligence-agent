/**
 * JSONB score structures per scoring_stage_type.
 * Derived from querying real production data (April 2026).
 *
 * Key patterns:
 * - For follow_up: engagement_score JSONB duplicates meeting_score content
 * - For onboarding: delivery_score JSONB duplicates meeting_score content
 * - rep_score fields like strengths/areas_for_improvement are PARAGRAPHS (strings), not arrays
 * - Each stage's numeric score field has a different name
 */

// ── Discovery/Scoping ──────────────────────────

export interface DiscoveryMeetingScore {
  lead_score?: number;
  deal_sentiment?: string;
  next_actionables?: string;
  last_meeting_date?: string;
  reasoning_summary?: string;
  tentative_closure_date?: string;
}

export interface DiscoveryRepScore {
  strengths?: string;
  handling_analysis?: string;
  areas_for_improvement?: string;
  rep_performance_score?: number;
  meeting_quality_rating?: string;
  coaching_recommendations?: string;
  deal_progression_assessment?: string;
}

export interface IcpScore {
  icp_fit_score?: number;
  title_fit_score?: number;
  confidence_level?: string;
  reason_for_score?: string;
  industry_fit_score?: number;
  department_fit_score?: number;
  icp_alignment_signals?: string[];
  company_size_fit_score?: number;
  icp_misalignment_signals?: string[];
}

// ── Follow-Up ──────────────────────────────────

export interface FollowUpMeetingScore {
  engagement_level?: string;
  engagement_score?: number;
  expansion_signals?: string[];
  reasoning_summary?: string;
  churn_risk_signals?: string[];
  relationship_health?: string;
}

export interface FollowUpRepScore {
  strengths?: string;
  blind_spots?: string;
  areas_for_improvement?: string;
  rep_performance_score?: number;
  meeting_quality_rating?: string;
  coaching_recommendations?: string;
}

// follow_up engagement_score JSONB has same structure as meeting_score
export type FollowUpEngagementScore = FollowUpMeetingScore;

// ── Onboarding ─────────────────────────────────

export interface OnboardingMeetingScore {
  blockers?: string[];
  current_phase?: string;
  delivery_score?: number;
  delivery_status?: string;
  project_progress?: string;
  reasoning_summary?: string;
  milestones_discussed?: string[];
}

export interface OnboardingRepScore {
  strengths?: string;
  blind_spots?: string;
  areas_for_improvement?: string;
  rep_performance_score?: number;
  meeting_quality_rating?: string;
  coaching_recommendations?: string;
}

// onboarding delivery_score JSONB has same structure as meeting_score
export type OnboardingDeliveryScore = OnboardingMeetingScore;

// ── Internal ───────────────────────────────────

export interface InternalMeetingScore {
  key_insight?: string;
  facilitation_notes?: string;
  productivity_rating?: string;
  meeting_quality_score?: number;
}

export interface InternalSummary {
  quality?: {
    key_insight?: string;
    facilitation_notes?: string;
    productivity_rating?: string;
    meeting_quality_score?: number;
  };
  summary?: {
    headline?: string;
    key_topics?: string[];
    meeting_type?: string;
    duration_assessment?: string;
  };
  action_items?: {
    owner: string;
    action: string;
    context?: string;
    deadline?: string;
    priority?: "high" | "medium" | "low";
  }[];
  kantata_tasks?: {
    title: string;
    assignee?: string;
    due_date?: string;
  }[];
  decisions_made?: {
    impact?: string;
    decision: string;
    rationale?: string;
  }[];
  open_questions?: string[];
  client_references?: {
    context?: string;
    sentiment?: "positive" | "neutral" | "negative" | "concern" | "at_risk";
    client_name: string;
    action_needed?: boolean;
  }[];
}

// ── Helpers to extract the primary numeric score per stage ──

export function getPrimaryScore(
  stageType: string | null,
  meetingScore: unknown,
  _internalSummary?: unknown, // eslint-disable-line @typescript-eslint/no-unused-vars
  _clientHealthScore?: number | null // eslint-disable-line @typescript-eslint/no-unused-vars
): number | null {
  if (!stageType) return null;

  switch (stageType) {
    case "discovery_scoping": {
      const ms = meetingScore as DiscoveryMeetingScore | null;
      return ms?.lead_score ?? null;
    }
    case "follow_up": {
      const ms = meetingScore as FollowUpMeetingScore | null;
      return ms?.engagement_score ?? null;
    }
    case "onboarding": {
      const ms = meetingScore as OnboardingMeetingScore | null;
      return ms?.delivery_score ?? null;
    }
    case "internal": {
      const ms = meetingScore as InternalMeetingScore | null;
      return ms?.meeting_quality_score ?? null;
    }
    default:
      return null;
  }
}

export function getRepPerformanceScore(repScore: unknown): number | null {
  if (!repScore || typeof repScore !== "object") return null;
  const rs = repScore as { rep_performance_score?: number };
  return rs.rep_performance_score ?? null;
}
