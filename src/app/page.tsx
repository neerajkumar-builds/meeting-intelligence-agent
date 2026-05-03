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
import { CompetitorMentions } from "@/components/scorecard/competitor-mentions";
// import { PipelineFunnel } from "@/components/scorecard/pipeline-funnel"; // Backlog: re-enable when companies span multiple stages
import { useSectionMeetings } from "@/lib/hooks/use-section-meetings";
import { useSection } from "@/lib/section-context";
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

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function TeamScorecardPage() {
  const { data: meetings, isLoading, error } = useSectionMeetings();
  const { sectionLabel } = useSection();
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
        <PageHeader title={`${sectionLabel} Scorecard`} />
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
        title={`${sectionLabel} Scorecard`}
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
          {/* KPI Summary — what matters at a glance */}
          <SummaryCards meetings={filtered} />

          {/* Insights — what needs attention right now */}
          <InsightsPanel meetings={filtered} />

          {/* Team — how are reps doing */}
          <SectionHeader title="Team" />
          <RepComparisonTable meetings={filtered} />

          {/* Performance — trends and distribution */}
          <SectionHeader title="Performance" />
          <div className="grid gap-6 lg:grid-cols-2">
            <ScoreTrendChart meetings={filtered} />
            <StageDistribution meetings={filtered} />
          </div>
          <ScoreDistributionChart meetings={filtered} />

          {/* Intelligence — market signals */}
          <SectionHeader title="Intelligence" />
          <CompetitorMentions />

          {/* Activity — recent timeline */}
          <RecentActivity meetings={filtered} />
        </div>
      )}
    </div>
  );
}
