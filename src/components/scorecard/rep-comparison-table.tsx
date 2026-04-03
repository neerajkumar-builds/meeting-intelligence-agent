"use client";

import Link from "next/link";
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
}

export function RepComparisonTable({ meetings }: RepComparisonTableProps) {
  const repMap = new Map<string, MeetingsListRow[]>();
  for (const m of meetings) {
    if (!m.host_name) continue;
    const list = repMap.get(m.host_name) ?? [];
    list.push(m);
    repMap.set(m.host_name, list);
  }

  const stats: RepStats[] = Array.from(repMap.entries())
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
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore);

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rep</TableHead>
            <TableHead className="text-center">Meetings</TableHead>
            <TableHead className="text-center">Avg Score</TableHead>
            <TableHead className="text-center">Avg Health</TableHead>
            <TableHead>Best Call</TableHead>
            <TableHead>Needs Work</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((rep) => (
            <TableRow key={rep.name}>
              <TableCell className="font-medium">{rep.name}</TableCell>
              <TableCell className="text-center">{rep.meetingCount}</TableCell>
              <TableCell className="text-center">
                <ScoreBadge score={rep.avgScore} />
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
