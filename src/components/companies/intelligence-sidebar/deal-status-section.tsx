"use client";

import { ScoreBadge } from "@/components/shared/score-badge";
import { formatDate } from "@/lib/utils/format";
import type { DealStatus } from "@/types/intelligence";

export function DealStatusSection({ data }: { data: DealStatus | null }) {
  return (
    <details className="group py-3 border-b">
      <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        Deal Status
        {data?.latestSentiment && (
          <span className="text-[10px] font-normal normal-case text-foreground">
            {data.latestSentiment}
          </span>
        )}
      </summary>
      {!data ? (
        <p className="mt-2 text-xs text-muted-foreground">No discovery meetings</p>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Lead Score</span>
            <ScoreBadge score={data.latestLeadScore} size="sm" />
          </div>
          {data.tentativeClosureDate && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Target Close</span>
              <span className="font-medium">{data.tentativeClosureDate}</span>
            </div>
          )}
          {data.nextActionables && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {data.nextActionables.slice(0, 120)}
              {data.nextActionables.length > 120 ? "..." : ""}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            From: {data.fromMeetingTopic} ({formatDate(data.fromMeetingDate)})
          </p>
        </div>
      )}
    </details>
  );
}
