"use client";

import Link from "next/link";
import { StageTypeBadge } from "@/components/shared/stage-type-badge";
import { ScoreBadge } from "@/components/shared/score-badge";
import { formatDate } from "@/lib/utils/format";
import type { MeetingsListRow } from "@/types/meetings";

interface MeetingTimelineProps {
  meetings: MeetingsListRow[];
}

export function MeetingTimeline({ meetings }: MeetingTimelineProps) {
  if (meetings.length === 0) return null;

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

      <div className="space-y-4">
        {meetings.map((meeting) => (
          <Link
            key={meeting.id}
            href={`/meetings/${meeting.id}`}
            className="relative flex items-start gap-4 pl-8 group"
          >
            {/* Dot */}
            <div className="absolute left-1.5 top-2 h-3 w-3 rounded-full border-2 border-background bg-primary group-hover:bg-primary/80" />

            <div className="flex-1 rounded-lg border bg-card p-3 transition-colors group-hover:bg-accent/50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StageTypeBadge stage={meeting.scoring_stage_type} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(meeting.start_time)}
                  </span>
                </div>
                <ScoreBadge score={meeting.overall_score} />
              </div>
              <p className="text-sm font-medium mt-1">
                {meeting.topic ?? "Untitled Meeting"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rep: {meeting.host_name ?? "Unknown"}
              </p>
              {meeting.meeting_summary && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {meeting.meeting_summary}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
