"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SummaryCards } from "@/components/scorecard/summary-cards";
import { RepComparisonTable } from "@/components/scorecard/rep-comparison-table";
import { ScoreDistributionChart } from "@/components/scorecard/score-distribution-chart";
import { InsightsPanel } from "@/components/scorecard/insights-panel";
import { ScoreTrendChart } from "@/components/scorecard/score-trend-chart";
import { StageDistribution } from "@/components/scorecard/stage-distribution";
import { RecentActivity } from "@/components/scorecard/recent-activity";
import { useMeetingsList } from "@/lib/hooks/use-meetings-list";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutDashboard } from "lucide-react";
import { subDays, subMonths, parseISO } from "date-fns";

const PERIODS = [
  { value: "all", label: "All Time" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

export default function TeamScorecardPage() {
  const { data: meetings, isLoading, error } = useMeetingsList();
  const [period, setPeriod] = useState("all");

  const filtered = useMemo(() => {
    if (!meetings || period === "all") return meetings ?? [];
    const now = new Date();
    const cutoff =
      period === "7d" ? subDays(now, 7) :
      period === "30d" ? subDays(now, 30) :
      subMonths(now, 3);
    return meetings.filter(
      (m) => m.start_time && parseISO(m.start_time) >= cutoff
    );
  }, [meetings, period]);

  if (error) {
    return (
      <div>
        <PageHeader title="Team Scorecard" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load meetings: {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Team Scorecard"
        description="Rep performance overview and meeting score distribution"
      >
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Period</label>
          <Select value={period} onValueChange={(v) => setPeriod(v ?? "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title={period === "all" ? "No meetings yet" : "No meetings in this period"}
          description={
            period === "all"
              ? "Meetings will appear here once the scoring pipeline processes them."
              : "Try selecting a longer time period."
          }
        />
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <SummaryCards meetings={filtered} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ScoreTrendChart meetings={filtered} />
            <StageDistribution meetings={filtered} />
          </div>
          <InsightsPanel meetings={filtered} />
          <RepComparisonTable meetings={filtered} />
          <ScoreDistributionChart meetings={filtered} />
          <RecentActivity meetings={filtered} />
        </div>
      )}
    </div>
  );
}
