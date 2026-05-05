"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatScore } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { parseISO, subDays } from "date-fns";
import type { MeetingsListRow } from "@/types/meetings";
import { useSection } from "@/lib/section-context";

interface SummaryCardsProps {
  meetings: MeetingsListRow[];
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const up = delta >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${up ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{delta.toFixed(1)}
    </span>
  );
}

function ScoreBar({ score, max = 10 }: { score: number | null; max?: number }) {
  if (score === null) return null;
  const pct = Math.min((score / max) * 100, 100);
  const color = score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function getCardTint(type: "info" | "good" | "mid" | "bad") {
  switch (type) {
    case "info": return "border-t-2 border-t-blue-500/40";
    case "good": return "border-t-2 border-t-emerald-500/40";
    case "mid": return "border-t-2 border-t-amber-500/40";
    case "bad": return "border-t-2 border-t-red-500/40";
  }
}

function getScoreTint(score: number | null): "info" | "good" | "mid" | "bad" {
  if (score === null) return "info";
  if (score >= 8) return "good";
  if (score >= 6) return "mid";
  return "bad";
}

export function SummaryCards({ meetings }: SummaryCardsProps) {
  const { activeSection } = useSection();
  const showHealthMetrics = activeSection === "cs" || activeSection === "all";
  const totalMeetings = meetings.length;

  const avgScore =
    meetings.reduce((sum, m) => sum + (m.overall_score ?? 0), 0) /
    (totalMeetings || 1);

  // Week-over-week deltas
  const now = new Date();
  const oneWeekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);

  const thisWeek = meetings.filter((m) => m.start_time && m.overall_score !== null && parseISO(m.start_time) >= oneWeekAgo);
  const lastWeek = meetings.filter((m) => m.start_time && m.overall_score !== null && parseISO(m.start_time) >= twoWeeksAgo && parseISO(m.start_time) < oneWeekAgo);
  const thisWeekAvg = thisWeek.length > 0 ? thisWeek.reduce((s, m) => s + m.overall_score!, 0) / thisWeek.length : null;
  const lastWeekAvg = lastWeek.length > 0 ? lastWeek.reduce((s, m) => s + m.overall_score!, 0) / lastWeek.length : null;
  const scoreDelta = thisWeekAvg !== null && lastWeekAvg !== null ? thisWeekAvg - lastWeekAvg : null;

  // Meeting count delta
  const thisWeekCount = meetings.filter((m) => m.start_time && parseISO(m.start_time) >= oneWeekAgo).length;
  const lastWeekCount = meetings.filter((m) => m.start_time && parseISO(m.start_time) >= twoWeeksAgo && parseISO(m.start_time) < oneWeekAgo).length;
  const countDelta = lastWeekCount > 0 ? thisWeekCount - lastWeekCount : null;

  // Health
  const healthMeetings = meetings.filter((m) => m.client_health_score !== null);
  const avgHealth =
    healthMeetings.length > 0
      ? healthMeetings.reduce((sum, m) => sum + m.client_health_score!, 0) / healthMeetings.length
      : null;
  const thisWeekHealth = healthMeetings.filter((m) => m.start_time && parseISO(m.start_time) >= oneWeekAgo);
  const lastWeekHealth = healthMeetings.filter((m) => m.start_time && parseISO(m.start_time) >= twoWeeksAgo && parseISO(m.start_time) < oneWeekAgo);
  const thisWeekHAvg = thisWeekHealth.length > 0 ? thisWeekHealth.reduce((s, m) => s + m.client_health_score!, 0) / thisWeekHealth.length : null;
  const lastWeekHAvg = lastWeekHealth.length > 0 ? lastWeekHealth.reduce((s, m) => s + m.client_health_score!, 0) / lastWeekHealth.length : null;
  const healthDelta = thisWeekHAvg !== null && lastWeekHAvg !== null ? thisWeekHAvg - lastWeekHAvg : null;

  // At-risk accounts
  const atRiskAccounts: string[] = [];
  const seen = new Set<string>();
  for (const m of meetings) {
    if (m.company_name && m.client_health_score !== null && m.client_health_score < 5 && !seen.has(m.company_name)) {
      atRiskAccounts.push(m.company_name);
      seen.add(m.company_name);
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Meetings */}
      <Link href="/meetings">
        <Card className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${getCardTint("info")}`}>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Meetings</p>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-3xl font-bold tracking-tight">{totalMeetings}</p>
              {countDelta !== null && <DeltaBadge delta={countDelta} />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {countDelta !== null ? `${thisWeekCount} this week` : "scored meetings"}
            </p>
          </CardContent>
        </Card>
      </Link>

      {/* Avg Score */}
      <Card className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${getCardTint(getScoreTint(totalMeetings > 0 ? avgScore : null))}`}>
        <CardContent className="p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" title="Scale: 0-10. 8+ Strong, 6-8 Average, below 6 Needs Attention">Avg Score <span className="normal-case tracking-normal opacity-60">/ 10</span></p>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-3xl font-bold tracking-tight">
              {formatScore(totalMeetings > 0 ? avgScore : null)}
            </p>
            <DeltaBadge delta={scoreDelta} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {scoreDelta !== null ? "vs last week" : "across all reps"}
          </p>
          <ScoreBar score={totalMeetings > 0 ? avgScore : null} />
        </CardContent>
      </Card>

      {/* Avg Health - CS/All sections only */}
      {showHealthMetrics && <Card className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${getCardTint(getScoreTint(avgHealth))}`}>
        <CardContent className="p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" title="Scale: 0-10. 8+ Healthy, 5-8 Monitor, below 5 At-Risk">Avg Health <span className="normal-case tracking-normal opacity-60">/ 10</span></p>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-3xl font-bold tracking-tight">
              {formatScore(avgHealth)}
            </p>
            <DeltaBadge delta={healthDelta} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {healthDelta !== null ? "vs last week" : `${healthMeetings.length} with health data`}
          </p>
          <ScoreBar score={avgHealth} />
        </CardContent>
      </Card>}

      {/* At-Risk Accounts - CS/All sections only */}
      {showHealthMetrics && <Card className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${atRiskAccounts.length > 0 ? getCardTint("bad") : getCardTint("good")}`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">At-Risk</p>
            {atRiskAccounts.length > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-3xl font-bold tracking-tight">{atRiskAccounts.length}</p>
            {atRiskAccounts.length > 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
          {atRiskAccounts.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {atRiskAccounts.slice(0, 3).map((name, i) => (
                <Link
                  key={name}
                  href={`/companies/${encodeURIComponent(name)}`}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  {name}{i < Math.min(atRiskAccounts.length, 3) - 1 ? "," : ""}
                </Link>
              ))}
              {atRiskAccounts.length > 3 && (
                <span className="text-xs text-muted-foreground">+{atRiskAccounts.length - 3}</span>
              )}
            </div>
          ) : (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">All healthy</p>
          )}
        </CardContent>
      </Card>}
    </div>
  );
}
