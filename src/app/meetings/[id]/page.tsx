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
import { useRouter } from "next/navigation";
import { IntelligenceSidebar } from "@/components/companies/intelligence-sidebar";
import { ExternalLink, ArrowLeft, Sparkles, Play, Video, Download } from "lucide-react";
import type { ScoringStageType } from "@/lib/constants";

export default function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: meeting, isLoading, error } = useMeetingDetail(id);
  const router = useRouter();

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
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0 space-y-6">
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
          {(() => {
            const ms = meeting.meeting_score as Record<string, unknown> | null;
            const sentiment = ms?.deal_sentiment as string | null;
            if (!sentiment) return null;
            const cls = sentiment.toLowerCase().includes("positive") || sentiment.toLowerCase().includes("strong")
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
              : sentiment.toLowerCase().includes("negative") || sentiment.toLowerCase().includes("stall")
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{sentiment}</span>;
          })()}
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
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Rep: {meeting.host_name ?? "Unknown"}</span>
            {meeting.company_name && <span>Company: {meeting.company_name}</span>}
            {meeting.primary_participant_name && (
              <span>Contact: {meeting.primary_participant_name}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
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
            meetingSummary={meeting.meeting_summary}
            meetingScore={meeting.meeting_score}
            repScore={meeting.rep_score}
            stageType={meeting.scoring_stage_type}
            overallScore={meeting.overall_score}
          />
          <button
            onClick={() => {
              const query = encodeURIComponent(`Tell me about the ${meeting.topic} meeting with ${meeting.host_name}`);
              router.push(`/search?q=${query}`);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask Blarney
          </button>
          </div>
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

      {/* Recording Banner */}
      {meeting.recording_url && (
        <div className="rounded-xl bg-gradient-to-r from-[#0B0E14] to-[#131820] border border-black/20 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="flex items-center gap-0">
            <a
              href={meeting.recording_url.replace("/rec/download/", "/rec/play/")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0 flex-1 min-w-0 group hover:bg-white/[0.02] transition-colors"
            >
              <div className="relative shrink-0 w-[140px] h-[80px] bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] flex items-center justify-center border-r border-white/5">
                <div className="h-10 w-10 rounded-full bg-[#2D8CFF]/20 flex items-center justify-center group-hover:bg-[#2D8CFF]/30 group-hover:scale-110 transition-all">
                  <Play className="h-4 w-4 text-[#2D8CFF] ml-0.5" />
                </div>
                {meeting.duration_minutes && (
                  <span className="absolute bottom-1.5 right-1.5 text-[9px] font-medium text-white/70 bg-black/60 px-1.5 py-0.5 rounded">
                    {meeting.duration_minutes}m
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 px-4 py-3">
                <p className="text-sm font-medium text-white/90">Watch Recording</p>
                <p className="text-xs text-white/40 mt-0.5 truncate">{meeting.topic}</p>
                <p className="text-[10px] text-white/25 mt-1">Requires Zoom login. Some recordings may need a passcode.</p>
              </div>
            </a>
            <div className="flex items-center gap-2 px-4 shrink-0 border-l border-white/5">
              <a
                href={meeting.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
                title="Download recording"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
              <div className="flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-[#2D8CFF]/60" />
                <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Zoom</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Intelligence Tabs */}
      <IntelligenceTabs
        stageType={meeting.scoring_stage_type as ScoringStageType}
        meetingId={meeting.id}
        meetingSummary={meeting.meeting_summary}
        meetingScore={meeting.meeting_score}
        repScore={meeting.rep_score}
        internalSummary={meeting.internal_summary}
      />

      {/* Transcript */}
      <TranscriptViewer transcript={meeting.transcript_text} meetingTopic={meeting.topic ?? undefined} />
      </div>

      {/* Intelligence Sidebar - only for external meetings with a company */}
      {meeting.company_name && (
        <IntelligenceSidebar companyName={meeting.company_name} />
      )}
    </div>
  );
}
