"use client";

import { useState } from "react";
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
  type CSMeetingScore,
  type InternalSummary,
  type EnhancedInternalScoring,
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

      <div className="rounded-lg border bg-card p-4">
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
        {stageType === "client_meeting" && (
          isCSRubricData(props.meetingScore)
            ? <CSScores meetingScore={props.meetingScore as CSMeetingScore} />
            : <OnboardingScores
                meetingScore={props.meetingScore as OnboardingMeetingScore | null}
                repScore={props.repScore as OnboardingRepScore | null}
                clientHealthScore={props.clientHealthScore}
              />
        )}
        {(stageType === "internal" || stageType === "internal_client_meeting") && (
          <EnhancedInternalScores
            meetingScore={props.meetingScore as InternalMeetingScore | null}
            internalSummary={props.internalSummary as InternalSummary | null}
          />
        )}
      </div>
    </div>
  );
}

function ScoreReasonItem({ label, reason }: { label: string; reason?: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!reason) return null;

  const isLong = reason.length > 180;
  const displayText = !expanded && isLong ? reason.slice(0, 180) + "..." : reason;

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="text-sm leading-relaxed">{displayText}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[#146DFA] hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
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
      <div className="flex flex-wrap items-start justify-center gap-6 md:gap-10 w-full">
        <CircularGauge
          size={90}
          score={meetingScore?.lead_score ?? null}
          label="Meeting Outcome"
          subtitle={meetingScore?.deal_sentiment ?? undefined}
        />
        <CircularGauge
          size={90}
          score={repScore?.rep_performance_score ?? null}
          label="Rep Performance"
          subtitle={repScore?.meeting_quality_rating ?? undefined}
        />
        <CircularGauge
          size={90}
          score={icpScore?.icp_fit_score ?? null}
          label="ICP Fit"
          subtitle={icpScore?.confidence_level ?? undefined}
        />
      </div>
      <div className="w-full border-t pt-4 mt-2 space-y-3">
        <ScoreReasonItem label="Meeting Outcome" reason={meetingScore?.reasoning_summary} />
        <ScoreReasonItem label="Rep Performance" reason={repScore?.strengths} />
        <ScoreReasonItem label="ICP Fit" reason={icpScore?.reason_for_score} />
      </div>
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
      <div className="flex flex-wrap items-start justify-center gap-6 md:gap-10 w-full">
        <CircularGauge
          size={90}
          score={meetingScore?.engagement_score ?? null}
          label="Engagement"
          subtitle={meetingScore?.engagement_level ?? undefined}
        />
        <CircularGauge
          size={90}
          score={repScore?.rep_performance_score ?? null}
          label="Rep Performance"
          subtitle={repScore?.meeting_quality_rating ?? undefined}
        />
        <CircularGauge
          size={90}
          score={clientHealthScore}
          label="Account Health"
          subtitle={meetingScore?.relationship_health ?? undefined}
        />
      </div>
      <div className="w-full border-t pt-4 mt-2 space-y-3">
        <ScoreReasonItem label="Engagement" reason={meetingScore?.reasoning_summary} />
        <ScoreReasonItem label="Rep Performance" reason={repScore?.strengths} />
      </div>
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
      <div className="flex flex-wrap items-start justify-center gap-6 md:gap-10 w-full">
        <CircularGauge
          size={90}
          score={meetingScore?.delivery_score ?? null}
          label="Delivery"
          subtitle={meetingScore?.delivery_status ?? undefined}
        />
        <CircularGauge
          size={90}
          score={repScore?.rep_performance_score ?? null}
          label="Rep Performance"
          subtitle={repScore?.meeting_quality_rating ?? undefined}
        />
        <CircularGauge
          size={90}
          score={clientHealthScore}
          label="Client Satisfaction"
          subtitle={meetingScore?.current_phase ?? undefined}
        />
      </div>
      <div className="w-full border-t pt-4 mt-2 space-y-3">
        <ScoreReasonItem label="Delivery" reason={meetingScore?.reasoning_summary} />
        <ScoreReasonItem label="Rep Performance" reason={repScore?.strengths} />
      </div>
    </>
  );
}

function isCSRubricData(meetingScore: unknown): meetingScore is CSMeetingScore {
  if (!meetingScore || typeof meetingScore !== "object") return false;
  return "category_scores" in meetingScore || "overall_health_score" in meetingScore;
}

const CS_CATEGORIES = [
  { key: "relationship_building", label: "Relationship", weight: "15%" },
  { key: "operational_updates", label: "Operations", weight: "15%" },
  { key: "outcome_review", label: "Outcomes", weight: "20%" },
  { key: "problem_solving", label: "Problem Solving", weight: "25%" },
  { key: "customer_sentiment", label: "Sentiment", weight: "15%" },
  { key: "closing_next_steps", label: "Closing", weight: "10%" },
] as const;

function CSScores({ meetingScore }: { meetingScore: CSMeetingScore }) {
  const cats = meetingScore.category_scores;
  const signals = meetingScore.strategic_signals;

  return (
    <>
      <div className="flex flex-wrap items-start justify-center gap-3 md:gap-5 w-full">
        <CircularGauge
          size={80}
          score={meetingScore.overall_health_score ?? null}
          label="Overall Health"
        />
        {CS_CATEGORIES.map(({ key, label, weight }) => {
          const cat = cats?.[key as keyof NonNullable<typeof cats>];
          const raw = cat?.score;
          return (
            <CircularGauge
              key={key}
              size={80}
              score={typeof raw === "number" && raw > 0 ? Math.min(raw * 2, 10) : null}
              label={label}
              subtitle={weight}
            />
          );
        })}
      </div>
      {signals && (
        <div className="w-full border-t pt-3 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Strategic Signals</p>
          <div className="flex flex-wrap gap-1.5">
            {signals.expansion_opportunity && <SignalBadge label="Expansion" variant="positive" />}
            {signals.renewal_risk && <SignalBadge label="Renewal Risk" variant="negative" />}
            {signals.stakeholder_misalignment && <SignalBadge label="Stakeholder Misalignment" variant="negative" />}
            {signals.executive_sponsor_absent && <SignalBadge label="Exec Sponsor Absent" variant="warning" />}
            {signals.adoption_concerns && <SignalBadge label="Adoption Concerns" variant="warning" />}
            {signals.budget_pressure && <SignalBadge label="Budget Pressure" variant="negative" />}
            {signals.timeline_pressure && <SignalBadge label="Timeline Pressure" variant="warning" />}
            {signals.competitive_mentions?.map((v) => (
              <SignalBadge key={v} label={`Competitor: ${v}`} variant="neutral" />
            ))}
          </div>
        </div>
      )}
      <div className="w-full border-t pt-4 mt-2 space-y-3">
        <ScoreReasonItem label="Summary" reason={meetingScore.reasoning_summary} />
      </div>
    </>
  );
}

function SignalBadge({ label, variant }: { label: string; variant: "positive" | "negative" | "warning" | "neutral" }) {
  const colors = {
    positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    negative: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[variant]}`}>{label}</span>;
}

const INTERNAL_CATEGORIES = [
  { key: "participation_engagement", label: "Participation", weight: "30%" },
  { key: "strategic_alignment", label: "Alignment", weight: "30%" },
  { key: "clarifying_questions", label: "Questions", weight: "15%" },
  { key: "action_items_accountability", label: "Accountability", weight: "25%" },
] as const;

function EnhancedInternalScores({
  meetingScore,
  internalSummary,
}: {
  meetingScore: InternalMeetingScore | null;
  internalSummary: InternalSummary | null;
}) {
  const enhanced = internalSummary?.enhanced_scoring;

  const hasCategoryScores = enhanced?.category_scores && Object.keys(enhanced.category_scores).length > 0;
  if (!hasCategoryScores) {
    return (
      <>
        <div className="flex flex-wrap items-start justify-center gap-6 md:gap-10 w-full">
          <CircularGauge
            score={meetingScore?.meeting_quality_score ?? null}
            label="Meeting Quality"
            subtitle={meetingScore?.productivity_rating ?? undefined}
          />
        </div>
        <div className="w-full border-t pt-4 mt-2 space-y-3">
          <ScoreReasonItem label="Key Insight" reason={meetingScore?.key_insight} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-center gap-6 md:gap-10 w-full">
        <CircularGauge
          size={90}
          score={enhanced.overall_effectiveness_score ?? null}
          label="Effectiveness"
        />
        {INTERNAL_CATEGORIES.map(({ key, label, weight }) => {
          const cat = enhanced.category_scores?.[key as keyof NonNullable<typeof enhanced.category_scores>];
          const raw = cat?.score;
          return (
            <CircularGauge
              key={key}
              size={90}
              score={typeof raw === "number" && raw > 0 ? Math.min(raw * 2, 10) : null}
              label={label}
              subtitle={weight}
            />
          );
        })}
      </div>
      {enhanced.organizational_signals && (
        <div className="w-full border-t pt-3 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Organizational Signals</p>
          <div className="flex flex-wrap gap-1.5">
            {enhanced.organizational_signals.repeated_blockers?.map((b) => (
              <SignalBadge key={b} label={`Blocker: ${b}`} variant="negative" />
            ))}
            {enhanced.organizational_signals.alignment_gaps?.map((g) => (
              <SignalBadge key={g} label={`Gap: ${g}`} variant="warning" />
            ))}
            {enhanced.organizational_signals.decision_bottlenecks?.map((d) => (
              <SignalBadge key={d} label={`Bottleneck: ${d}`} variant="warning" />
            ))}
            {enhanced.organizational_signals.ownership_clarity && (
              <SignalBadge
                label={`Ownership: ${enhanced.organizational_signals.ownership_clarity}`}
                variant={enhanced.organizational_signals.ownership_clarity === "strong" ? "positive" : "warning"}
              />
            )}
          </div>
        </div>
      )}
      <div className="w-full border-t pt-4 mt-2 space-y-3">
        <ScoreReasonItem label="Key Insight" reason={meetingScore?.key_insight} />
      </div>
    </>
  );
}
