"use client";

import { PageHeader } from "@/components/layout/page-header";
import { SystemMetrics } from "@/components/health/system-metrics";
import { StatusBreakdown } from "@/components/health/status-breakdown";
import { ProcessingLog } from "@/components/health/processing-log";
import { ConnectionStatus } from "@/components/health/connection-status";
import { PipelineStatus } from "@/components/health/pipeline-status";
import { Skeleton } from "@/components/ui/skeleton";
import { usePipelineStats } from "@/lib/hooks/use-pipeline-stats";
import { useScoringRunLog } from "@/lib/hooks/use-scoring-run-log";
import { Wifi, BarChart3, Activity, ScrollText, RefreshCw } from "lucide-react";

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-2">
      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <h2 className="text-sm font-semibold">{title}</h2>
    </div>
  );
}

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
        title="System Overview"
        description="Service health, scoring metrics, and workflow monitoring"
      />

      <div className="space-y-8">
        {/* Section 0: Pipeline Sync Status */}
        <section>
          <SectionHeader icon={RefreshCw} title="Pipeline Sync" />
          <PipelineStatus />
        </section>

        {/* Section 1: Connection Status */}
        <section>
          <SectionHeader icon={Wifi} title="Service Status" />
          <ConnectionStatus />
        </section>

        {/* Section 2: System Metrics */}
        <section>
          <SectionHeader icon={BarChart3} title="System Metrics" />
          {statsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : stats ? (
            <SystemMetrics stats={stats} />
          ) : null}
        </section>

        {/* Section 3: Meeting Status Distribution */}
        <section>
          <SectionHeader icon={Activity} title="Meeting Status Distribution" />
          {statsLoading ? (
            <Skeleton className="h-64 rounded-lg" />
          ) : stats ? (
            <StatusBreakdown statusCounts={stats.statusCounts} />
          ) : null}
        </section>

        {/* Section 4: Workflow Run History */}
        <section>
          <SectionHeader icon={ScrollText} title="Workflow Run History" />
          {logsLoading ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : logs ? (
            <ProcessingLog logs={logs} />
          ) : null}
        </section>
      </div>
    </div>
  );
}
