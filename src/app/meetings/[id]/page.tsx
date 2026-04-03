"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StageTypeBadge } from "@/components/shared/stage-type-badge";
import { ScoreSection } from "@/components/meetings/score-section";
import { IntelligenceTabs } from "@/components/meetings/intelligence-tabs";
import { TranscriptViewer } from "@/components/meetings/transcript-viewer";
import { ActionsMenu } from "@/components/meetings/meeting-actions/actions-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetingDetail } from "@/lib/hooks/use-meeting-detail";
import { formatDateTime, formatDuration } from "@/lib/utils/format";
import { ExternalLink, ArrowLeft } from "lucide-react";
import type { ScoringStageType } from "@/lib/constants";

export default function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: meeting, isLoading, error } = useMeetingDetail(id);

  if (error) {
    return (
      <div>
        <PageHeader title="Meeting Detail" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load meeting: {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div>
        <PageHeader title="Meeting Not Found" />
        <p className="text-sm text-muted-foreground">
          No meeting found with this ID.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to meetings
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <StageTypeBadge stage={meeting.scoring_stage_type} />
          <span className="text-sm text-muted-foreground">
            {formatDateTime(meeting.start_time)}
          </span>
          {meeting.duration_minutes && (
            <span className="text-sm text-muted-foreground">
              {formatDuration(meeting.duration_minutes)}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{meeting.topic ?? "Untitled Meeting"}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span>Rep: {meeting.host_name ?? "Unknown"}</span>
          {meeting.company_name && <span>Company: {meeting.company_name}</span>}
          {meeting.primary_participant_name && (
            <span>Contact: {meeting.primary_participant_name}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          {meeting.google_doc_url && (
            <a
              href={meeting.google_doc_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Google Doc
            </a>
          )}
          <ActionsMenu
            meetingId={meeting.id}
            companyName={meeting.company_name}
            transcript={meeting.transcript_text}
            topic={meeting.topic}
          />
        </div>
      </div>

      {/* Scores */}
      <ScoreSection
        stageType={meeting.scoring_stage_type as ScoringStageType}
        meetingScore={meeting.meeting_score}
        repScore={meeting.rep_score}
        icpScore={meeting.icp_score}
        engagementScore={meeting.engagement_score}
        deliveryScore={meeting.delivery_score}
        internalSummary={meeting.internal_summary}
        clientHealthScore={meeting.client_health_score}
        overallScore={meeting.overall_score}
      />

      {/* Intelligence Tabs */}
      <IntelligenceTabs
        stageType={meeting.scoring_stage_type as ScoringStageType}
        meetingSummary={meeting.meeting_summary}
        meetingScore={meeting.meeting_score}
        repScore={meeting.rep_score}
        internalSummary={meeting.internal_summary}
      />

      {/* Transcript */}
      <TranscriptViewer transcript={meeting.transcript_text} />
    </div>
  );
}
