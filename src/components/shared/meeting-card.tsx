import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StageTypeBadge } from "./stage-type-badge";
import { ScoreBadge } from "./score-badge";
import { formatDate, formatDuration } from "@/lib/utils/format";
import type { MeetingsListRow } from "@/types/meetings";

interface MeetingCardProps {
  meeting: MeetingsListRow;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card className="transition-all duration-200 hover:bg-accent/50 hover:shadow-md hover:-translate-y-0.5">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StageTypeBadge stage={meeting.scoring_stage_type} />
                <span className="text-xs text-muted-foreground">
                  {formatDate(meeting.start_time)}
                </span>
                {meeting.duration_minutes && (
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(meeting.duration_minutes)}
                  </span>
                )}
              </div>
              <h3 className="font-medium text-sm truncate">
                {meeting.topic ?? "Untitled Meeting"}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{meeting.host_name ?? "Unknown Rep"}</span>
                {meeting.company_name && (
                  <>
                    <span>·</span>
                    <span>{meeting.company_name}</span>
                  </>
                )}
              </div>
              {meeting.meeting_summary && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                  {meeting.meeting_summary}
                </p>
              )}
            </div>
            <ScoreBadge score={meeting.overall_score} size="lg" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
