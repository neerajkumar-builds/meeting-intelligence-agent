"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/components/shared/score-badge";
import type { ScoringStageType } from "@/lib/constants";
import { STAGE_SCORE_FIELDS } from "@/lib/utils/stage";
import {
  type DiscoveryMeetingScore,
  type DiscoveryRepScore,
  type IcpScore,
  type FollowUpMeetingScore,
  type FollowUpRepScore,
  type OnboardingMeetingScore,
  type OnboardingRepScore,
  type InternalMeetingScore,
  getRepPerformanceScore,
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

function ScoreCard({
  label,
  score,
  subtitle,
}: {
  label: string;
  score: number | null;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        <div className="flex justify-center">
          <ScoreBadge score={score} size="lg" />
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
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

      <div className="grid gap-4 md:grid-cols-3">
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
      <ScoreCard
        label="Meeting Outcome"
        score={meetingScore?.lead_score ?? null}
        subtitle={meetingScore?.deal_sentiment ?? undefined}
      />
      <ScoreCard
        label="Rep Performance"
        score={repScore?.rep_performance_score ?? null}
        subtitle={repScore?.meeting_quality_rating ?? undefined}
      />
      <ScoreCard
        label="ICP Fit"
        score={icpScore?.icp_fit_score ?? null}
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
      <ScoreCard
        label="Engagement"
        score={meetingScore?.engagement_score ?? null}
        subtitle={meetingScore?.engagement_level ?? undefined}
      />
      <ScoreCard
        label="Rep Performance"
        score={repScore?.rep_performance_score ?? null}
        subtitle={repScore?.meeting_quality_rating ?? undefined}
      />
      <ScoreCard
        label="Account Health"
        score={clientHealthScore}
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
      <ScoreCard
        label="Delivery"
        score={meetingScore?.delivery_score ?? null}
        subtitle={meetingScore?.delivery_status ?? undefined}
      />
      <ScoreCard
        label="Rep Performance"
        score={repScore?.rep_performance_score ?? null}
        subtitle={repScore?.meeting_quality_rating ?? undefined}
      />
      <ScoreCard
        label="Client Satisfaction"
        score={clientHealthScore}
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
    <>
      <ScoreCard
        label="Meeting Quality"
        score={meetingScore?.meeting_quality_score ?? null}
        subtitle={meetingScore?.productivity_rating ?? undefined}
      />
    </>
  );
}
