"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatScore } from "@/lib/utils/format";
import { TrendingUp, TrendingDown } from "lucide-react";
import { parseISO, subDays } from "date-fns";
import type { MeetingsListRow } from "@/types/meetings";

interface SummaryCardsProps {
  meetings: MeetingsListRow[];
}

export function SummaryCards({ meetings }: SummaryCardsProps) {
  const totalMeetings = meetings.length;

  const avgScore =
    meetings.reduce((sum, m) => sum + (m.overall_score ?? 0), 0) /
    (totalMeetings || 1);

  // Week-over-week delta for avg score
  const now = new Date();
  const oneWeekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);
  const thisWeek = meetings.filter((m) => m.start_time && m.overall_score !== null && parseISO(m.start_time) >= oneWeekAgo);
  const lastWeek = meetings.filter((m) => m.start_time && m.overall_score !== null && parseISO(m.start_time) >= twoWeeksAgo && parseISO(m.start_time) < oneWeekAgo);
  const thisWeekAvg = thisWeek.length > 0 ? thisWeek.reduce((s, m) => s + m.overall_score!, 0) / thisWeek.length : null;
  const lastWeekAvg = lastWeek.length > 0 ? lastWeek.reduce((s, m) => s + m.overall_score!, 0) / lastWeek.length : null;
  const weekDelta = thisWeekAvg !== null && lastWeekAvg !== null ? thisWeekAvg - lastWeekAvg : null;

  // Average health across meetings with health data
  const healthMeetings = meetings.filter((m) => m.client_health_score !== null);
  const avgHealth =
    healthMeetings.length > 0
      ? healthMeetings.reduce((sum, m) => sum + m.client_health_score!, 0) / healthMeetings.length
      : null;

  // At-risk accounts: companies with client_health_score < 5
  const atRiskAccounts: string[] = [];
  const seen = new Set<string>();
  for (const m of meetings) {
    if (
      m.company_name &&
      m.client_health_score !== null &&
      m.client_health_score < 5 &&
      !seen.has(m.company_name)
    ) {
      atRiskAccounts.push(m.company_name);
      seen.add(m.company_name);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Link href="/meetings">
        <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Meetings</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{totalMeetings}</p>
            <p className="text-xs text-muted-foreground mt-1">scored meetings</p>
          </CardContent>
        </Card>
      </Link>

      <Card
        className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        style={{ animationDelay: "75ms" }}
      >
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Avg Score</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-3xl font-bold tracking-tight">
              {formatScore(totalMeetings > 0 ? avgScore : null)}
            </p>
            {weekDelta !== null && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${weekDelta >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                {weekDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {weekDelta >= 0 ? "+" : ""}{weekDelta.toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {weekDelta !== null ? "vs last week" : "across all reps"}
          </p>
        </CardContent>
      </Card>

      <Card
        className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        style={{ animationDelay: "150ms" }}
      >
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Avg Health</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">
            {formatScore(avgHealth)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {healthMeetings.length} meetings with health data
          </p>
        </CardContent>
      </Card>

      {/* At-Risk Accounts — clickable, links to each company */}
      <Card
        className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        style={{ animationDelay: "225ms" }}
      >
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">At-Risk Accounts</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">{atRiskAccounts.length}</p>
          {atRiskAccounts.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {atRiskAccounts.slice(0, 3).map((name) => (
                <Link
                  key={name}
                  href={`/companies/${encodeURIComponent(name)}`}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  {name}{atRiskAccounts.indexOf(name) < Math.min(atRiskAccounts.length, 3) - 1 ? "," : ""}
                </Link>
              ))}
              {atRiskAccounts.length > 3 && (
                <span className="text-xs text-muted-foreground">+{atRiskAccounts.length - 3} more</span>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">health score &lt; 5</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
