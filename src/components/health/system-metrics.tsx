"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { PipelineStats } from "@/lib/hooks/use-pipeline-stats";

interface SystemMetricsProps {
  stats: PipelineStats;
}

export function SystemMetrics({ stats }: SystemMetricsProps) {
  const completedCount = stats.statusCounts["completed"] ?? 0;
  const pendingCount = stats.statusCounts["pending"] ?? 0;
  const failedCount = stats.statusCounts["scoring_failed"] ?? 0;
  const needsReviewCount = stats.statusCounts["needs_review"] ?? 0;

  const metrics = [
    {
      label: "Total Meetings",
      value: stats.totalMeetings,
      description: "in scored_meetings table",
    },
    {
      label: "Completed",
      value: completedCount,
      description: "fully scored",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Needs Review",
      value: needsReviewCount + pendingCount,
      description: "pending + needs_review",
      color:
        needsReviewCount + pendingCount > 0
          ? "text-yellow-600 dark:text-yellow-400"
          : undefined,
    },
    {
      label: "Failed",
      value: failedCount,
      description: "scoring_failed",
      color:
        failedCount > 0
          ? "text-red-600 dark:text-red-400"
          : undefined,
    },
    {
      label: "Embedded",
      value: stats.embeddedMeetings,
      description: "ready for RAG search",
    },
    {
      label: "Chunks",
      value: stats.totalChunks,
      description: "in meeting_chunks",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className={`text-2xl font-bold mt-1 ${metric.color ?? ""}`}>
              {metric.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
