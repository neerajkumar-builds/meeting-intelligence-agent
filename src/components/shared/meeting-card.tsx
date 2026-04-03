import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StageTypeBadge } from "./stage-type-badge";
import { ScoreBadge } from "./score-badge";
import { formatDate, formatDuration } from "@/lib/utils/format";
import { getScoreBand } from "@/lib/constants";
import type { MeetingsListRow } from "@/types/meetings";

interface MeetingCardProps {
  meeting: MeetingsListRow;
  index?: number;
}

const ACCENT_COLORS = {
  emerald: "border-l-emerald-500",
  yellow: "border-l-yellow-500",
  red: "border-l-red-500",
};

export function MeetingCard({ meeting, index = 0 }: MeetingCardProps) {
  const band = getScoreBand(meeting.overall_score);
  const accentClass = band
    ? ACCENT_COLORS[band.color]
    : "border-l-gray-300 dark:border-l-gray-600";

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="block"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Card
        className={`border-l-4 ${accentClass} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-1`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-snug">
                {meeting.topic ?? "Untitled Meeting"}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                <StageTypeBadge stage={meeting.scoring_stage_type} />
                <span className="text-xs text-muted-foreground">
                  {meeting.host_name ?? "Unknown Rep"}
                </span>
                {meeting.company_name && (
                  <>
                    <span className="text-xs text-muted-foreground/50">|</span>
                    <span
                      className="text-xs text-primary hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/companies/${encodeURIComponent(meeting.company_name!)}`;
                      }}
                    >
                      {meeting.company_name}
                    </span>
                  </>
                )}
                <span className="text-xs text-muted-foreground/50">|</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(meeting.start_time)}
                </span>
                {meeting.duration_minutes && (
                  <span className="text-xs text-muted-foreground/50">
                    ({formatDuration(meeting.duration_minutes)})
                  </span>
                )}
              </div>
              {meeting.meeting_summary && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {meeting.meeting_summary}
                </p>
              )}
            </div>
            <div className="shrink-0">
              <ScoreBadge score={meeting.overall_score} size="lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
