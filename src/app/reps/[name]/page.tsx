"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { MeetingCard } from "@/components/shared/meeting-card";
import { ScoreBadge } from "@/components/shared/score-badge";
import { BrandTooltip } from "@/components/shared/chart-tooltip";
import { ChartDownload } from "@/components/shared/chart-download";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useMeetingsList } from "@/lib/hooks/use-meetings-list";
import { formatScore } from "@/lib/utils/format";
import { getStageLabel } from "@/lib/utils/stage";
import { ArrowLeft, User, TrendingUp, TrendingDown } from "lucide-react";
import { parseISO, startOfWeek, format } from "date-fns";

const STAGE_COLORS: Record<string, string> = {
  discovery_scoping: "#146DFA",
  follow_up: "#8b5cf6",
  onboarding: "#10b981",
  internal: "#94a3b8",
};

export default function RepProfilePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const repName = decodeURIComponent(name);
  const { data: allMeetings, isLoading } = useMeetingsList();

  const meetings = useMemo(
    () => (allMeetings ?? []).filter((m) => m.host_name === repName),
    [allMeetings, repName]
  );

  const teamMeetings = useMemo(() => allMeetings ?? [], [allMeetings]);

  const stats = useMemo(() => {
    if (meetings.length === 0) return null;

    const scored = meetings.filter((m) => m.overall_score !== null);
    const avgScore = scored.length > 0
      ? scored.reduce((s, m) => s + m.overall_score!, 0) / scored.length
      : null;

    const teamScored = teamMeetings.filter((m) => m.overall_score !== null);
    const teamAvg = teamScored.length > 0
      ? teamScored.reduce((s, m) => s + m.overall_score!, 0) / teamScored.length
      : null;

    const healthScores = meetings.filter((m) => m.client_health_score !== null);
    const avgHealth = healthScores.length > 0
      ? healthScores.reduce((s, m) => s + m.client_health_score!, 0) / healthScores.length
      : null;

    const stageCounts = new Map<string, number>();
    for (const m of meetings) {
      if (m.scoring_stage_type) {
        stageCounts.set(m.scoring_stage_type, (stageCounts.get(m.scoring_stage_type) ?? 0) + 1);
      }
    }

    const weeklyData = new Map<string, { total: number; count: number }>();
    for (const m of scored) {
      if (!m.start_time) continue;
      const week = format(startOfWeek(parseISO(m.start_time), { weekStartsOn: 1 }), "MMM d");
      const entry = weeklyData.get(week) ?? { total: 0, count: 0 };
      entry.total += m.overall_score!;
      entry.count += 1;
      weeklyData.set(week, entry);
    }

    const trend = Array.from(weeklyData.entries()).map(([week, { total, count }]) => ({
      week,
      score: parseFloat((total / count).toFixed(1)),
    }));

    let best = scored[0] ?? null;
    let worst = scored[0] ?? null;
    for (const m of scored) {
      if (m.overall_score! > (best?.overall_score ?? 0)) best = m;
      if (m.overall_score! < (worst?.overall_score ?? 10)) worst = m;
    }

    return { avgScore, teamAvg, avgHealth, stageCounts, trend, best, worst, total: meetings.length };
  }, [meetings, teamMeetings]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 md:grid-cols-4"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to scorecard
        </Link>
        <EmptyState icon={User} title={`No meetings for ${repName}`} description="No scored meetings found for this rep." />
      </div>
    );
  }

  const delta = stats.avgScore && stats.teamAvg ? stats.avgScore - stats.teamAvg : 0;
  const aboveTeam = delta >= 0;

  const stageData = Array.from(stats.stageCounts.entries()).map(([stage, count]) => ({
    name: getStageLabel(stage),
    value: count,
    color: STAGE_COLORS[stage] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to scorecard
      </Link>

      {/* Header — compact */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{repName}</h1>
          <p className="text-xs text-muted-foreground">{stats.total} meetings · {((stats.total / (teamMeetings.length || 1)) * 100).toFixed(0)}% of team volume</p>
        </div>
      </div>

      {/* KPI Row — all text-based, consistent */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Avg Score</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">{formatScore(stats.avgScore)}</span>
              <ScoreBadge score={stats.avgScore} size="sm" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">vs Team</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-2xl font-bold ${aboveTeam ? "text-emerald-600" : "text-red-500"}`}>
                {aboveTeam ? "+" : ""}{delta.toFixed(1)}
              </span>
              {aboveTeam ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>
            <p className="text-[10px] text-muted-foreground">Team avg: {formatScore(stats.teamAvg)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Avg Health</p>
            <span className="text-2xl font-bold mt-1 block">{formatScore(stats.avgHealth)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Best / Worst</p>
            <div className="mt-1 space-y-0.5">
              {stats.best && (
                <Link href={`/meetings/${stats.best.id}`} className="flex items-center gap-1.5 text-xs hover:underline">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="truncate">{stats.best.topic}</span>
                  <ScoreBadge score={stats.best.overall_score} size="sm" />
                </Link>
              )}
              {stats.worst && (
                <Link href={`/meetings/${stats.worst.id}`} className="flex items-center gap-1.5 text-xs hover:underline">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  <span className="truncate">{stats.worst.topic}</span>
                  <ScoreBadge score={stats.worst.overall_score} size="sm" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts — trend + donut side by side */}
      <div className="grid gap-4 lg:grid-cols-5">
        {stats.trend.length >= 2 && (
          <Card className="lg:col-span-3">
            <ChartDownload title={`${repName} Score Trend`}>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold mb-3">Score Trend</h3>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={stats.trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="repTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#146DFA" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#146DFA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BrandTooltip />} />
                  <Area type="monotone" dataKey="score" stroke="#146DFA" strokeWidth={2} fill="url(#repTrend)" dot={{ r: 3, fill: "#146DFA" }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
            </ChartDownload>
          </Card>
        )}
        <Card className={stats.trend.length >= 2 ? "lg:col-span-2" : "lg:col-span-5"}>
          <ChartDownload title={`${repName} Meeting Types`}>
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold mb-3">Meeting Types</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={stageData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" strokeWidth={2} stroke="hsl(var(--background))">
                    {stageData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1">
                {stageData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          </ChartDownload>
        </Card>
      </div>

      {/* Recent Meetings */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent Meetings</h3>
        <div className="space-y-2">
          {meetings.slice(0, 10).map((m, i) => (
            <MeetingCard key={m.id} meeting={m} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
