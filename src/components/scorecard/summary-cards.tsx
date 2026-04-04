"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatScore } from "@/lib/utils/format";
import type { MeetingsListRow } from "@/types/meetings";

interface SummaryCardsProps {
  meetings: MeetingsListRow[];
}

export function SummaryCards({ meetings }: SummaryCardsProps) {
  const totalMeetings = meetings.length;

  const avgScore =
    meetings.reduce((sum, m) => sum + (m.overall_score ?? 0), 0) /
    (totalMeetings || 1);

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
      <Card
        className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      >
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Total Meetings</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">{totalMeetings}</p>
          <p className="text-xs text-muted-foreground mt-1">scored meetings</p>
        </CardContent>
      </Card>

      <Card
        className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        style={{ animationDelay: "75ms" }}
      >
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Avg Score</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">
            {formatScore(totalMeetings > 0 ? avgScore : null)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">across all reps</p>
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
