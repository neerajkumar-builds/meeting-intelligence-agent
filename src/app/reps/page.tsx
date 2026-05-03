"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ScoreBadge } from "@/components/shared/score-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useSectionMeetings } from "@/lib/hooks/use-section-meetings";
import { formatScore, formatRelativeDate } from "@/lib/utils/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, TrendingUp, TrendingDown, LayoutGrid, List } from "lucide-react";

interface RepStats {
  name: string;
  meetingCount: number;
  avgScore: number | null;
  avgHealth: number | null;
  teamVolumePercent: number;
  lastMeeting: string | null;
}

export default function RepsIndexPage() {
  const { data: meetings, isLoading, error } = useSectionMeetings();
  const [sortBy, setSortBy] = useState<"score" | "meetings" | "az" | "health">("score");
  const [view, setView] = useState<"table" | "cards">("table");

  const { reps, teamAvg } = useMemo(() => {
    if (!meetings) return { reps: [], teamAvg: 0 };

    const map = new Map<string, RepStats>();
    const totalMeetings = meetings.length;

    for (const m of meetings) {
      if (!m.host_name) continue;
      const entry = map.get(m.host_name) ?? {
        name: m.host_name,
        meetingCount: 0,
        avgScore: null,
        avgHealth: null,
        teamVolumePercent: 0,
        lastMeeting: null,
      };

      entry.meetingCount++;
      if (!entry.lastMeeting || (m.start_time && m.start_time > entry.lastMeeting)) {
        entry.lastMeeting = m.start_time ?? null;
      }
      map.set(m.host_name, entry);
    }

    const scored = meetings.filter((m) => m.overall_score !== null);
    const teamAvgScore = scored.length > 0 ? scored.reduce((s, m) => s + m.overall_score!, 0) / scored.length : 0;

    for (const [name, rep] of map) {
      const repMeetings = meetings.filter((m) => m.host_name === name);
      const repScored = repMeetings.filter((m) => m.overall_score !== null);
      const repHealth = repMeetings.filter((m) => m.client_health_score !== null);

      rep.avgScore = repScored.length > 0 ? repScored.reduce((s, m) => s + m.overall_score!, 0) / repScored.length : null;
      rep.avgHealth = repHealth.length > 0 ? repHealth.reduce((s, m) => s + m.client_health_score!, 0) / repHealth.length : null;
      rep.teamVolumePercent = totalMeetings > 0 ? Math.round((rep.meetingCount / totalMeetings) * 100) : 0;
    }

    const repsList = Array.from(map.values());

    repsList.sort((a, b) => {
      switch (sortBy) {
        case "score": return (b.avgScore ?? 0) - (a.avgScore ?? 0);
        case "meetings": return b.meetingCount - a.meetingCount;
        case "health": return (b.avgHealth ?? 0) - (a.avgHealth ?? 0);
        case "az": return a.name.localeCompare(b.name);
        default: return (b.avgScore ?? 0) - (a.avgScore ?? 0);
      }
    });

    return { reps: repsList, teamAvg: teamAvgScore };
  }, [meetings, sortBy]);

  if (error) {
    return (
      <div>
        <PageHeader title="Reps" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Failed to load rep data: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reps"
        description={reps.length > 0 ? `${reps.length} reps with scored meetings` : undefined}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : reps.length === 0 ? (
        <EmptyState
          icon={User}
          title="No rep data"
          description="Rep profiles will appear once meetings are scored."
        />
      ) : (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort by</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Avg Score</SelectItem>
                  <SelectItem value="meetings">Meetings</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="az">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
              <button
                onClick={() => setView("table")}
                className={`p-1.5 rounded-md transition-colors ${view === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Table view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setView("cards")}
                className={`p-1.5 rounded-md transition-colors ${view === "cards" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Card view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Table view */}
          {view === "table" && (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Rep</th>
                    <th className="text-center px-3 py-2.5 font-medium text-xs text-muted-foreground">Meetings</th>
                    <th className="text-center px-3 py-2.5 font-medium text-xs text-muted-foreground">Avg Score</th>
                    <th className="text-center px-3 py-2.5 font-medium text-xs text-muted-foreground">vs Team</th>
                    <th className="text-center px-3 py-2.5 font-medium text-xs text-muted-foreground">Health</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">Last Meeting</th>
                  </tr>
                </thead>
                <tbody>
                  {reps.map((rep) => {
                    const delta = rep.avgScore !== null ? rep.avgScore - teamAvg : null;
                    const aboveTeam = delta !== null && delta >= 0;

                    return (
                      <tr key={rep.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/reps/${encodeURIComponent(rep.name)}`} className="flex items-center gap-2.5 hover:underline">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{rep.name}</p>
                              <p className="text-[10px] text-muted-foreground">{rep.teamVolumePercent}% of team</p>
                            </div>
                          </Link>
                        </td>
                        <td className="text-center px-3 py-3 text-sm">{rep.meetingCount}</td>
                        <td className="text-center px-3 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-sm font-medium">{formatScore(rep.avgScore)}</span>
                            <ScoreBadge score={rep.avgScore} size="sm" />
                          </div>
                        </td>
                        <td className="text-center px-3 py-3">
                          {delta !== null ? (
                            <span className={`text-sm font-medium inline-flex items-center gap-0.5 ${aboveTeam ? "text-emerald-500" : "text-red-500"}`}>
                              {aboveTeam ? "+" : ""}{delta.toFixed(1)}
                              {aboveTeam ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="text-center px-3 py-3 text-sm">{formatScore(rep.avgHealth)}</td>
                        <td className="text-right px-4 py-3 text-xs text-muted-foreground">{formatRelativeDate(rep.lastMeeting)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Card view */}
          {view === "cards" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reps.map((rep) => {
                const delta = rep.avgScore !== null ? rep.avgScore - teamAvg : null;
                const aboveTeam = delta !== null && delta >= 0;
                const scoreTint = rep.avgScore === null ? "border-t-blue-500/40"
                  : rep.avgScore >= 8 ? "border-t-emerald-500/40"
                  : rep.avgScore >= 6 ? "border-t-amber-500/40"
                  : "border-t-red-500/40";

                return (
                  <Link key={rep.name} href={`/reps/${encodeURIComponent(rep.name)}`}>
                    <Card className={`border-t-2 ${scoreTint} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{rep.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {rep.meetingCount} meetings - {rep.teamVolumePercent}% of team
                            </p>
                          </div>
                          <ScoreBadge score={rep.avgScore} size="sm" />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold">{formatScore(rep.avgScore)}</p>
                            <p className="text-[10px] text-muted-foreground">Avg Score</p>
                          </div>
                          <div>
                            {delta !== null ? (
                              <p className={`text-lg font-bold flex items-center justify-center gap-0.5 ${aboveTeam ? "text-emerald-500" : "text-red-500"}`}>
                                {aboveTeam ? "+" : ""}{delta.toFixed(1)}
                                {aboveTeam ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              </p>
                            ) : (
                              <p className="text-lg font-bold text-muted-foreground">-</p>
                            )}
                            <p className="text-[10px] text-muted-foreground">vs Team</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{formatScore(rep.avgHealth)}</p>
                            <p className="text-[10px] text-muted-foreground">Health</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
