"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StageTypeBadge } from "@/components/shared/stage-type-badge";
import { ScoreBadge } from "@/components/shared/score-badge";
import { formatRelativeDate } from "@/lib/utils/format";
import { Clock } from "lucide-react";
import type { MeetingsListRow } from "@/types/meetings";

interface RecentActivityProps {
  meetings: MeetingsListRow[];
}

export function RecentActivity({ meetings }: RecentActivityProps) {
  const recent = meetings.slice(0, 5);
  if (recent.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Recent Activity</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {recent.map((m) => (
            <Link
              key={m.id}
              href={`/meetings/${m.id}`}
              className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/50 hover:border-primary/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{m.topic ?? "Untitled"}</p>
                  <ScoreBadge score={m.overall_score} size="sm" />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <StageTypeBadge stage={m.scoring_stage_type} />
                  <span className="text-xs text-muted-foreground">{m.host_name}</span>
                  <span className="text-xs text-muted-foreground">{formatRelativeDate(m.start_time)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
