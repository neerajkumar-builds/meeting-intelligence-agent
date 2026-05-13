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
  enhanced_scoring?: EnhancedInternalScoring;
}

// ── CS / Client Meeting (Stephen's 6-category rubric) ─────

export interface CSCategoryScore {
  score?: number;
  signals?: string[];
  watchouts?: string[];
}

export interface CSMeetingScore {
  category_scores?: {
    relationship_building?: CSCategoryScore;
    operational_updates?: CSCategoryScore;
    outcome_review?: CSCategoryScore;
    problem_solving?: CSCategoryScore;
    customer_sentiment?: CSCategoryScore;
    closing_next_steps?: CSCategoryScore;
  };
  overall_health_score?: number;
  strategic_signals?: {
    expansion_opportunity?: boolean;
    renewal_risk?: boolean;
    stakeholder_misalignment?: boolean;
    executive_sponsor_absent?: boolean;
    adoption_concerns?: boolean;
    competitive_mentions?: string[];
    budget_pressure?: boolean;
    timeline_pressure?: boolean;
  };
  coaching_signals?: {
    talk_listen_ratio?: string;
    interruptions?: number;
    engagement_depth?: string;
    discovery_quality?: string;
    confidence_level?: string;
    clarity_rating?: string;
    jargon_overuse?: boolean;
  };
  reasoning_summary?: string;
  sentiment_score?: number;
  relationship_health_score?: number;
  expansion_likelihood?: string;
  escalation_risk?: string;
}

export interface CSCallNotes {
  client_actions?: string[];
  fullfunnel_actions?: string[];
  kantata_tasks?: { title: string; assignee?: string; due_date?: string }[];
}

// ── Enhanced Internal (Stephen's 4+2 category rubric) ─────

export interface EnhancedInternalScoring {
  category_scores?: {
    participation_engagement?: {
      score?: number;
      talk_time_distribution?: Record<string, string>;
      silent_participants?: string[];
      dominating_voices?: string[];
      collaboration_quality?: string;
    };
    strategic_alignment?: {
      score?: number;
      alignment_moments?: string[];
      unresolved_disagreements?: string[];
      strategic_vs_tactical_ratio?: string;
    };
    clarifying_questions?: {
      score?: number;
      notable_questions?: string[];
      gaps_identified?: string[];
      assumptions_challenged?: number;
    };
    action_items_accountability?: {
      score?: number;
      named_owners?: number;
      deadlines_set?: number;
      follow_up_mechanisms?: string[];
    };
  };
  overall_effectiveness_score?: number;
  decision_velocity?: {
    decisions_made?: number;
    decisions_deferred?: number;
    debate_time_ratio?: string;
    repeated_unresolved?: string[];
  };
  meeting_efficiency?: {
    agenda_adherence?: string;
    off_topic_minutes?: number;
    signal_to_noise?: string;
  };
  organizational_signals?: {
    alignment_gaps?: string[];
    repeated_blockers?: string[];
    decision_bottlenecks?: string[];
    ownership_clarity?: string;
    engagement_trend?: string;
    leadership_participation_trends?: string;
    cross_functional_friction?: string[];
  };
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
    case "client_meeting": {
      const ms = meetingScore as CSMeetingScore | OnboardingMeetingScore | null;
      if (ms && "overall_health_score" in ms) return (ms as CSMeetingScore).overall_health_score ?? null;
      return (ms as OnboardingMeetingScore)?.delivery_score ?? null;
    }
    case "internal":
    case "internal_client_meeting": {
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
