"use client";

import { CircularGauge } from "@/components/shared/circular-gauge";
import { ScoreBadge } from "@/components/shared/score-badge";
import type { ScoringStageType } from "@/lib/constants";
import {
  type DiscoveryMeetingScore,
  type DiscoveryRepScore,
  type IcpScore,
  type FollowUpMeetingScore,
  type FollowUpRepScore,
  type OnboardingMeetingScore,
  type OnboardingRepScore,
  type InternalMeetingScore,
} from "@/types/scores";

interface ScoreSectionProps {
  stageType: ScoringStageType | null;
  meetingScore: unknown;
  repScore: unknown;
  icpScore: unknown;
  engagementScore: unknown;
  deliveryScore: unknown;
  internalSummary: unknown;
  clientHealthScore: number | null;
  overallScore: number | null;
}

export function ScoreSection(props: ScoreSectionProps) {
  const { stageType, overallScore } = props;
  if (!stageType) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Scores</h2>
        <ScoreBadge score={overallScore} size="lg" />
        <span className="text-sm text-muted-foreground">overall</span>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-start justify-center gap-8 md:gap-12">
          {stageType === "discovery_scoping" && (
            <DiscoveryScores
              meetingScore={props.meetingScore as DiscoveryMeetingScore | null}
              repScore={props.repScore as DiscoveryRepScore | null}
              icpScore={props.icpScore as IcpScore | null}
            />
          )}
          {stageType === "follow_up" && (
            <FollowUpScores
              meetingScore={props.meetingScore as FollowUpMeetingScore | null}
              repScore={props.repScore as FollowUpRepScore | null}
              clientHealthScore={props.clientHealthScore}
            />
          )}
          {stageType === "onboarding" && (
            <OnboardingScores
              meetingScore={props.meetingScore as OnboardingMeetingScore | null}
              repScore={props.repScore as OnboardingRepScore | null}
              clientHealthScore={props.clientHealthScore}
            />
          )}
          {stageType === "internal" && (
            <InternalScores
              meetingScore={props.meetingScore as InternalMeetingScore | null}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DiscoveryScores({
  meetingScore,
  repScore,
  icpScore,
}: {
  meetingScore: DiscoveryMeetingScore | null;
  repScore: DiscoveryRepScore | null;
  icpScore: IcpScore | null;
}) {
  return (
    <>
      <CircularGauge
        score={meetingScore?.lead_score ?? null}
        label="Meeting Outcome"
        subtitle={meetingScore?.deal_sentiment ?? undefined}
      />
      <CircularGauge
        score={repScore?.rep_performance_score ?? null}
        label="Rep Performance"
        subtitle={repScore?.meeting_quality_rating ?? undefined}
      />
      <CircularGauge
        score={icpScore?.icp_fit_score ?? null}
        label="ICP Fit"
        subtitle={icpScore?.confidence_level ?? undefined}
      />
    </>
  );
}

function FollowUpScores({
  meetingScore,
  repScore,
  clientHealthScore,
}: {
  meetingScore: FollowUpMeetingScore | null;
  repScore: FollowUpRepScore | null;
  clientHealthScore: number | null;
}) {
  return (
    <>
      <CircularGauge
        score={meetingScore?.engagement_score ?? null}
        label="Engagement"
        subtitle={meetingScore?.engagement_level ?? undefined}
      />
      <CircularGauge
        score={repScore?.rep_performance_score ?? null}
        label="Rep Performance"
        subtitle={repScore?.meeting_quality_rating ?? undefined}
      />
      <CircularGauge
        score={clientHealthScore}
        label="Account Health"
        subtitle={meetingScore?.relationship_health ?? undefined}
      />
    </>
  );
}

function OnboardingScores({
  meetingScore,
  repScore,
  clientHealthScore,
}: {
  meetingScore: OnboardingMeetingScore | null;
  repScore: OnboardingRepScore | null;
  clientHealthScore: number | null;
}) {
  return (
    <>
      <CircularGauge
        score={meetingScore?.delivery_score ?? null}
        label="Delivery"
        subtitle={meetingScore?.delivery_status ?? undefined}
      />
      <CircularGauge
        score={repScore?.rep_performance_score ?? null}
        label="Rep Performance"
        subtitle={repScore?.meeting_quality_rating ?? undefined}
      />
      <CircularGauge
        score={clientHealthScore}
        label="Client Satisfaction"
        subtitle={meetingScore?.current_phase ?? undefined}
      />
    </>
  );
}

function InternalScores({
  meetingScore,
}: {
  meetingScore: InternalMeetingScore | null;
}) {
  return (
    <CircularGauge
      score={meetingScore?.meeting_quality_score ?? null}
      label="Meeting Quality"
      subtitle={meetingScore?.productivity_rating ?? undefined}
    />
  );
}
