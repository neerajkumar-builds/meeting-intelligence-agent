import type { ScoringStageType } from "@/lib/constants";

/**
 * Row from the `meetings_list` view — lightweight, no transcript or JSONB scores.
 * Used by: Team Scorecard, Meeting Feed, Company View
 */
export interface MeetingsListRow {
  id: string;
  topic: string | null;
  host_name: string | null;
  company_name: string | null;
  primary_participant_name: string | null;
  scoring_stage_type: ScoringStageType | null;
  start_time: string | null;
  duration_minutes: number | null;
  overall_score: number | null;
  client_health_score: number | null;
  meeting_summary: string | null;
  google_doc_url: string | null;
}

/**
 * Full row from `scored_meetings` table — used for Meeting Detail only.
 * Includes JSONB score fields and transcript.
 */
export interface ScoredMeetingRow {
  id: string;
  meeting_uuid: string;
  host_email: string;
  host_name: string | null;
  topic: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  meeting_stage: string | null;
  recording_url: string | null;
  transcript_url: string | null;
  has_transcript: boolean;

  participant_emails: unknown;
  participant_names: unknown;
  primary_participant_email: string | null;
  primary_participant_name: string | null;

  hubspot_contact_id: string | null;
  hubspot_company_id: string | null;
  company_name: string | null;
  company_domain: string | null;

  transcript_text: string | null;
  word_count: number | null;
  meeting_summary: string | null;
  ai_extracted_participants: unknown;
  ai_meeting_theme: string | null;
  resolution_method: string | null;

  scoring_stage_type: ScoringStageType | null;
  rep_score: unknown; // JSONB — varies by stage
  meeting_score: unknown; // JSONB — discovery only
  icp_score: unknown; // JSONB — discovery only
  engagement_score: unknown; // JSONB — follow_up only
  delivery_score: unknown; // JSONB — onboarding only
  internal_summary: unknown; // JSONB — internal only
  client_health_score: number | null;
  overall_score: number | null;

  google_doc_url: string | null;
  hubspot_updated: boolean;

  status: string;
  error_message: string | null;
  scoring_model: string | null;
  scored_at: string | null;
  captured_at: string | null;
  updated_at: string | null;
  embedded_at: string | null;
}

/**
 * Row from `zoom_users` table — rep configuration.
 */
export interface ZoomUserRow {
  id: string;
  zoom_user_id: string | null;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  classification: string | null;
  enabled_for_scoring: boolean;
  hubspot_owner_id: string | null;
}

/**
 * Row from `scoring_run_log` table — pipeline observability.
 */
export interface ScoringRunLogRow {
  id: string;
  workflow_name: string;
  run_started_at: string;
  run_completed_at: string | null;
  meetings_captured: number;
  meetings_scored: number;
  meetings_failed: number;
  meetings_no_contact: number;
  error_details: unknown;
  status: string;
}
