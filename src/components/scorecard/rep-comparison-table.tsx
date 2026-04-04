"use client";

import { useId, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart, Area, ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoreBadge } from "@/components/shared/score-badge";
import { formatScore } from "@/lib/utils/format";
import { parseISO, startOfWeek, format } from "date-fns";
import type { MeetingsListRow } from "@/types/meetings";

interface RepComparisonTableProps {
  meetings: MeetingsListRow[];
}

interface RepStats {
  name: string;
  meetingCount: number;
  avgScore: number;
  avgHealthScore: number | null;
  bestCall: { topic: string; score: number; id: string } | null;
  worstCall: { topic: string; score: number; id: string } | null;
  trend: { week: string; score: number }[];
}

function buildWeeklyTrend(meetings: MeetingsListRow[]): { week: string; score: number }[] {
  const weekMap = new Map<string, { total: number; count: number }>();
  for (const m of meetings) {
    if (!m.start_time || m.overall_score === null) continue;
    const week = format(startOfWeek(parseISO(m.start_time), { weekStartsOn: 1 }), "MM/dd");
    const entry = weekMap.get(week) ?? { total: 0, count: 0 };
    entry.total += m.overall_score;
    entry.count += 1;
    weekMap.set(week, entry);
  }
  return Array.from(weekMap.entries())
    .map(([week, { total, count }]) => ({ week, score: parseFloat((total / count).toFixed(1)) }));
}

function MiniSparkline({ data }: { data: { week: string; score: number }[] }) {
  const id = useId();
  if (data.length < 2) return <span className="text-xs text-muted-foreground">—</span>;
  const lastScore = data[data.length - 1].score;
  const prevScore = data[data.length - 2].score;
  const color = lastScore >= prevScore ? "#10b981" : "#ef4444";
  const gradientId = `spark-${id}`;
  return (
    <ResponsiveContainer width={60} height={24}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="score" stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RepComparisonTable({ meetings }: RepComparisonTableProps) {
  const stats: RepStats[] = useMemo(() => {
    const repMap = new Map<string, MeetingsListRow[]>();
    for (const m of meetings) {
      if (!m.host_name) continue;
      const list = repMap.get(m.host_name) ?? [];
      list.push(m);
      repMap.set(m.host_name, list);
    }

    return Array.from(repMap.entries())
      .map(([name, repMeetings]) => {
        const scored = repMeetings.filter((m) => m.overall_score !== null);
        const avgScore =
          scored.reduce((s, m) => s + m.overall_score!, 0) /
          (scored.length || 1);

        const withHealth = repMeetings.filter(
          (m) => m.client_health_score !== null
        );
        const avgHealthScore =
          withHealth.length > 0
            ? withHealth.reduce((s, m) => s + m.client_health_score!, 0) /
              withHealth.length
            : null;

        let bestCall: RepStats["bestCall"] = null;
        let worstCall: RepStats["worstCall"] = null;
        for (const m of scored) {
          if (!bestCall || m.overall_score! > bestCall.score) {
            bestCall = {
              topic: m.topic ?? "Untitled",
              score: m.overall_score!,
              id: m.id,
            };
          }
          if (!worstCall || m.overall_score! < worstCall.score) {
            worstCall = {
              topic: m.topic ?? "Untitled",
              score: m.overall_score!,
              id: m.id,
            };
          }
        }

        return {
          name,
          meetingCount: repMeetings.length,
          avgScore,
          avgHealthScore,
          bestCall,
          worstCall,
          trend: buildWeeklyTrend(repMeetings),
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [meetings]);

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rep</TableHead>
            <TableHead className="text-center">Meetings</TableHead>
            <TableHead className="text-center">Avg Score</TableHead>
            <TableHead className="text-center w-[80px]">Trend</TableHead>
            <TableHead className="text-center">Avg Health</TableHead>
            <TableHead>Best Call</TableHead>
            <TableHead>Needs Work</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((rep) => (
            <TableRow key={rep.name}>
              <TableCell>
                <Link
                  href={`/reps/${encodeURIComponent(rep.name)}`}
                  className="font-medium text-primary hover:underline"
                >
                  {rep.name}
                </Link>
              </TableCell>
              <TableCell className="text-center">{rep.meetingCount}</TableCell>
              <TableCell className="text-center">
                <ScoreBadge score={rep.avgScore} />
              </TableCell>
              <TableCell className="text-center">
                <MiniSparkline data={rep.trend} />
              </TableCell>
              <TableCell className="text-center">
                {rep.avgHealthScore !== null
                  ? formatScore(rep.avgHealthScore)
                  : "—"}
              </TableCell>
              <TableCell>
                {rep.bestCall ? (
                  <Link
                    href={`/meetings/${rep.bestCall.id}`}
                    className="text-xs hover:underline"
                  >
                    {rep.bestCall.topic.substring(0, 30)}
                    {rep.bestCall.topic.length > 30 ? "..." : ""} (
                    {formatScore(rep.bestCall.score)})
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {rep.worstCall ? (
                  <Link
                    href={`/meetings/${rep.worstCall.id}`}
                    className="text-xs hover:underline"
                  >
                    {rep.worstCall.topic.substring(0, 30)}
                    {rep.worstCall.topic.length > 30 ? "..." : ""} (
                    {formatScore(rep.worstCall.score)})
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
