"use client";

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

  // Top performer: rep with highest average score (min 2 meetings)
  const repScores = new Map<string, { total: number; count: number }>();
  for (const m of meetings) {
    if (!m.host_name || m.overall_score === null) continue;
    const entry = repScores.get(m.host_name) ?? { total: 0, count: 0 };
    entry.total += m.overall_score;
    entry.count += 1;
    repScores.set(m.host_name, entry);
  }
  let topPerformer = "—";
  let topAvg = 0;
  for (const [name, { total, count }] of repScores) {
    if (count < 2) continue;
    const avg = total / count;
    if (avg > topAvg) {
      topAvg = avg;
      topPerformer = name;
    }
  }

  // At-risk accounts: companies with client_health_score < 5
  const atRiskAccounts = new Set<string>();
  for (const m of meetings) {
    if (
      m.company_name &&
      m.client_health_score !== null &&
      m.client_health_score < 5
    ) {
      atRiskAccounts.add(m.company_name);
    }
  }

  const cards = [
    {
      label: "Total Meetings",
      value: totalMeetings.toString(),
      subtext: "scored meetings",
    },
    {
      label: "Avg Score",
      value: formatScore(totalMeetings > 0 ? avgScore : null),
      subtext: "across all reps",
    },
    {
      label: "Top Performer",
      value: topPerformer,
      subtext: topPerformer !== "—" ? `avg ${formatScore(topAvg)}` : "needs 2+ meetings",
    },
    {
      label: "At-Risk Accounts",
      value: atRiskAccounts.size.toString(),
      subtext: "health score < 5",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <Card
          key={card.label}
          className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
