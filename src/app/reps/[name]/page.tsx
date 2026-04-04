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
import { CircularGauge } from "@/components/shared/circular-gauge";
import { BrandTooltip } from "@/components/shared/chart-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useMeetingsList } from "@/lib/hooks/use-meetings-list";
import { formatScore } from "@/lib/utils/format";
import { getStageLabel } from "@/lib/utils/stage";
import { ArrowLeft, User, TrendingUp, Target, Calendar } from "lucide-react";
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

  const teamMeetings = allMeetings ?? [];

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

    // Stage breakdown
    const stageCounts = new Map<string, number>();
    for (const m of meetings) {
      if (m.scoring_stage_type) {
        stageCounts.set(m.scoring_stage_type, (stageCounts.get(m.scoring_stage_type) ?? 0) + 1);
      }
    }

    // Weekly trend
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

    // Best and worst
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
        <div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        <Skeleton className="h-64" />
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

  const stageData = Array.from(stats.stageCounts.entries()).map(([stage, count]) => ({
    name: getStageLabel(stage),
    value: count,
    color: STAGE_COLORS[stage] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to scorecard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{repName}</h1>
          <p className="text-sm text-muted-foreground">{stats.total} scored meetings</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
            <CircularGauge score={stats.avgScore} label="" size={80} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">vs Team Avg</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-bold">
                {stats.avgScore && stats.teamAvg
                  ? (stats.avgScore - stats.teamAvg > 0 ? "+" : "") + (stats.avgScore - stats.teamAvg).toFixed(1)
                  : "—"}
              </span>
              <TrendingUp className={`h-4 w-4 ${stats.avgScore && stats.teamAvg && stats.avgScore >= stats.teamAvg ? "text-emerald-500" : "text-red-500"}`} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Team avg: {formatScore(stats.teamAvg)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Health</p>
            <p className="text-2xl font-bold mt-2">{formatScore(stats.avgHealth)}</p>
            <p className="text-xs text-muted-foreground mt-1">client accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Meetings</p>
            <p className="text-2xl font-bold mt-2">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.total / (teamMeetings.length || 1)) * 100).toFixed(0)}% of team volume
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Trend */}
        {stats.trend.length >= 2 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4">Score Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="repTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#146DFA" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#146DFA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BrandTooltip />} />
                  <Area type="monotone" dataKey="score" stroke="#146DFA" strokeWidth={2} fill="url(#repTrend)" dot={{ r: 3, fill: "#146DFA" }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Stage Breakdown */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4">Meeting Types</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={stageData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={2} stroke="hsl(var(--background))">
                    {stageData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {stageData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best & Worst */}
      <div className="grid gap-4 md:grid-cols-2">
        {stats.best && (
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Best Meeting</p>
              <Link href={`/meetings/${stats.best.id}`} className="text-sm font-medium hover:underline">
                {stats.best.topic} ({formatScore(stats.best.overall_score)})
              </Link>
            </CardContent>
          </Card>
        )}
        {stats.worst && (
          <Card className="border-l-4 border-l-red-400">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-red-500 mb-1">Needs Work</p>
              <Link href={`/meetings/${stats.worst.id}`} className="text-sm font-medium hover:underline">
                {stats.worst.topic} ({formatScore(stats.worst.overall_score)})
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Meetings */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Meetings</h3>
        <div className="space-y-3">
          {meetings.slice(0, 10).map((m, i) => (
            <MeetingCard key={m.id} meeting={m} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
