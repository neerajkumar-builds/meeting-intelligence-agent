"use client";

import { PageHeader } from "@/components/layout/page-header";
import { SystemMetrics } from "@/components/health/system-metrics";
import { StatusBreakdown } from "@/components/health/status-breakdown";
import { ProcessingLog } from "@/components/health/processing-log";
import { ConnectionStatus } from "@/components/health/connection-status";
import { Skeleton } from "@/components/ui/skeleton";
import { usePipelineStats } from "@/lib/hooks/use-pipeline-stats";
import { useScoringRunLog } from "@/lib/hooks/use-scoring-run-log";

export default function PipelineHealthPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = usePipelineStats();
  const { data: logs, isLoading: logsLoading } = useScoringRunLog(10);

  if (statsError) {
    return (
      <div>
        <PageHeader title="Pipeline Health" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load pipeline data: {(statsError as Error).message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pipeline Health"
        description="System monitoring: processing status, error rates, and RAG readiness"
      />

      <div className="space-y-6">
        <ConnectionStatus />

        {statsLoading ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </>
        ) : stats ? (
          <>
            <SystemMetrics stats={stats} />
            <StatusBreakdown statusCounts={stats.statusCounts} />
          </>
        ) : null}

        {logsLoading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : logs ? (
          <ProcessingLog logs={logs} />
        ) : null}
      </div>
    </div>
  );
}
