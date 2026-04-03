"use client";

import { ScoreBadge } from "@/components/shared/score-badge";
import { formatDate } from "@/lib/utils/format";
import type { MeetingsListRow } from "@/types/meetings";

interface CompanyHeaderProps {
  companyName: string;
  meetings: MeetingsListRow[];
}

export function CompanyHeader({ companyName, meetings }: CompanyHeaderProps) {
  const totalMeetings = meetings.length;

  const dates = meetings
    .map((m) => m.start_time)
    .filter(Boolean)
    .sort() as string[];
  const firstMeeting = dates[0] ?? null;
  const lastMeeting = dates[dates.length - 1] ?? null;

  const healthScores = meetings
    .map((m) => m.client_health_score)
    .filter((s): s is number => s !== null);
  const avgHealth =
    healthScores.length > 0
      ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length
      : null;

  const avgScore =
    meetings.filter((m) => m.overall_score !== null).length > 0
      ? meetings
          .filter((m) => m.overall_score !== null)
          .reduce((s, m) => s + m.overall_score!, 0) /
        meetings.filter((m) => m.overall_score !== null).length
      : null;

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">{companyName}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Meetings" value={totalMeetings.toString()} />
        <Stat
          label="First Meeting"
          value={formatDate(firstMeeting)}
        />
        <Stat
          label="Last Meeting"
          value={formatDate(lastMeeting)}
        />
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Avg Health</p>
          <div className="mt-1">
            <ScoreBadge score={avgHealth} size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}
