"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MeetingCard } from "@/components/shared/meeting-card";
import { ScoreBadge } from "@/components/shared/score-badge";
import { BrandTooltip } from "@/components/shared/chart-tooltip";
import { ChartDownload } from "@/components/shared/chart-download";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useMeetingsList } from "@/lib/hooks/use-meetings-list";
import { formatScore } from "@/lib/utils/format";
import { getStageLabel } from "@/lib/utils/stage";
import { STAGE_CONFIG, type ScoringStageType } from "@/lib/constants";
import { CoachingSummary } from "@/components/reps/coaching-summary";
import { InternalInsightsSummary } from "@/components/reps/internal-insights-summary";
import { ArrowLeft, User, TrendingUp, TrendingDown, Sparkles, ExternalLink, SlidersHorizontal, CalendarDays } from "lucide-react";
import { parseISO, startOfWeek, format, subDays, subMonths } from "date-fns";

const STAGE_COLORS: Record<string, string> = {
  discovery_scoping: "#146DFA",
  follow_up: "#8b5cf6",
  onboarding: "#10b981",
  internal: "#94a3b8",
};

function getScoreTint(score: number | null): string {
  if (score === null) return "border-t-2 border-t-blue-500/40";
  if (score >= 8) return "border-t-2 border-t-emerald-500/40";
  if (score >= 6) return "border-t-2 border-t-amber-500/40";
  return "border-t-2 border-t-red-500/40";
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

export default function RepProfilePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const repName = decodeURIComponent(name);
  const { data: allMeetings, isLoading } = useMeetingsList();
  const router = useRouter();

  const [stageFilter, setStageFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [periodPreset, setPeriodPreset] = useState("all");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  function handlePeriodChange(v: string) {
    setPeriodPreset(v);
    setCustomRange(undefined);
  }
  function handleRangeSelect(range: DateRange | undefined) {
    setCustomRange(range);
    if (range?.from) setPeriodPreset("all");
  }

  const meetings = useMemo(() => {
    const now = new Date();
    const dateCutoff =
      periodPreset === "7d" ? subDays(now, 7) :
      periodPreset === "30d" ? subDays(now, 30) :
      periodPreset === "90d" ? subMonths(now, 3) : null;

    return (allMeetings ?? []).filter((m) => {
      if (m.host_name !== repName) return false;
      if (dateCutoff && m.start_time && parseISO(m.start_time) < dateCutoff) return false;
      if (customRange?.from && m.start_time && parseISO(m.start_time) < customRange.from) return false;
      if (customRange?.to && m.start_time && parseISO(m.start_time) > customRange.to) return false;
      return true;
    });
  }, [allMeetings, repName, periodPreset, customRange]);

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

  // Filtered + sorted meetings for the list
  const filteredMeetings = useMemo(() => {
    let result = [...meetings];
    if (stageFilter !== "all") {
      result = result.filter((m) => m.scoring_stage_type === stageFilter);
    }
    result.sort((a, b) => {
      if (sortBy === "score") return (b.overall_score ?? 0) - (a.overall_score ?? 0);
      return new Date(b.start_time ?? 0).getTime() - new Date(a.start_time ?? 0).getTime();
    });
    return result;
  }, [meetings, stageFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 md:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <Skeleton className="h-52" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <Link href="/reps" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to reps
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
      <Link href="/reps" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to reps
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{repName}</h1>
            <p className="text-xs text-muted-foreground">{stats.total} meetings · {((stats.total / (teamMeetings.length || 1)) * 100).toFixed(0)}% of team volume</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={periodPreset} onValueChange={(v) => handlePeriodChange(v ?? "all")}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-muted transition-colors h-8"
            >
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              {customRange?.from ? (
                <span>
                  {format(customRange.from, "MMM d")}
                  {customRange.to ? ` – ${format(customRange.to, "MMM d")}` : ""}
                </span>
              ) : (
                <span className="text-muted-foreground">Pick dates</span>
              )}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={handleRangeSelect}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
            </PopoverContent>
          </Popover>
          <button
            onClick={() => {
              const query = encodeURIComponent(`Show coaching insights for ${repName} across all meetings`);
              router.push(`/search?q=${query}`);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ask Blarney</span>
          </button>
        </div>
      </div>

      {/* KPI Row — tinted cards with score bars */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${getScoreTint(stats.avgScore)}`}>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground" title="Scale: 0-10. 8+ Strong, 6-8 Average, below 6 Needs Attention">Avg Score <span className="opacity-60">/ 10</span></p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">{formatScore(stats.avgScore)}</span>
              <ScoreBadge score={stats.avgScore} size="sm" />
            </div>
            <ScoreBar score={stats.avgScore} />
          </CardContent>
        </Card>
        <Card className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${aboveTeam ? "border-t-2 border-t-emerald-500/40" : "border-t-2 border-t-red-500/40"}`}>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">vs Team Avg</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-2xl font-bold ${aboveTeam ? "text-emerald-600" : "text-red-500"}`}>
                {aboveTeam ? "+" : ""}{delta.toFixed(1)}
              </span>
              {aboveTeam ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Team avg: {formatScore(stats.teamAvg)}</p>
          </CardContent>
        </Card>
        <Card className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${getScoreTint(stats.avgHealth)}`}>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground" title="Scale: 0-10. 8+ Healthy, 5-8 Monitor, below 5 At-Risk">Avg Health <span className="opacity-60">/ 10</span></p>
            <span className="text-2xl font-bold mt-1 block">{formatScore(stats.avgHealth)}</span>
            <ScoreBar score={stats.avgHealth} />
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-t-2 border-t-blue-500/40">
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Best / Worst Call</p>
            <div className="mt-1.5 space-y-1.5">
              {stats.best && (
                <Link href={`/meetings/${stats.best.id}`} className="flex items-center gap-1.5 text-xs hover:underline group">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate max-w-[120px] group-hover:text-foreground">{stats.best.topic}</span>
                  <ScoreBadge score={stats.best.overall_score} size="sm" />
                </Link>
              )}
              {stats.worst && stats.worst.id !== stats.best?.id && (
                <Link href={`/meetings/${stats.worst.id}`} className="flex items-center gap-1.5 text-xs hover:underline group">
                  <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
                  <span className="truncate max-w-[120px] group-hover:text-foreground">{stats.worst.topic}</span>
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
              <ResponsiveContainer width="100%" height={200}>
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
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={stageData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={2} stroke="hsl(var(--background))">
                    {stageData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {stageData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
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

      {/* Coaching Insights - from scored_meetings rep_score JSONB (read-only) */}
      <CoachingSummary repName={repName} />

      {/* Internal Meeting Insights - from scored_meetings internal_summary JSONB (read-only) */}
      <InternalInsightsSummary repName={repName} />

      {/* Meetings — with filters */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Meetings {stageFilter !== "all" ? `· Showing ${filteredMeetings.length} of ${meetings.length}` : `· ${meetings.length} total`}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
            <Select value={stageFilter} onValueChange={(v) => setStageFilter(v ?? "all")}>
              <SelectTrigger className="w-[130px] h-7 text-xs">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {(Object.entries(STAGE_CONFIG) as [ScoringStageType, (typeof STAGE_CONFIG)[ScoringStageType]][]).map(
                  ([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "score")}>
              <SelectTrigger className="w-[100px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="score">By Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          {filteredMeetings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No meetings match this filter.</p>
          ) : (
            filteredMeetings.map((m, i) => (
              <MeetingCard key={m.id} meeting={m} index={i} />
            ))
          )}
        </div>
        {meetings.length > 0 && (
          <Link
            href={`/meetings?rep=${encodeURIComponent(repName)}`}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-3"
          >
            <ExternalLink className="h-3 w-3" />
            View all in Meeting Feed
          </Link>
        )}
      </div>
    </div>
  );
}
