"use client";

import { PageHeader } from "@/components/layout/page-header";
import { SummaryCards } from "@/components/scorecard/summary-cards";
import { RepComparisonTable } from "@/components/scorecard/rep-comparison-table";
import { ScoreDistributionChart } from "@/components/scorecard/score-distribution-chart";
import { useMeetingsList } from "@/lib/hooks/use-meetings-list";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { LayoutDashboard } from "lucide-react";

export default function TeamScorecardPage() {
  const { data: meetings, isLoading, error } = useMeetingsList();

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
      />

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
      ) : !meetings || meetings.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title="No meetings yet"
          description="Meetings will appear here once the scoring pipeline processes them."
        />
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <SummaryCards meetings={meetings} />
          <RepComparisonTable meetings={meetings} />
          <ScoreDistributionChart meetings={meetings} />
        </div>
      )}
    </div>
  );
}
