"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils/format";
import { ChevronDown } from "lucide-react";
import type { PipelineStats } from "@/lib/hooks/use-pipeline-stats";

interface SystemMetricsProps {
  stats: PipelineStats;
}

interface ReviewMeeting {
  id: string;
  topic: string | null;
  host_name: string | null;
  start_time: string | null;
  status: string;
  error_message: string | null;
}

export function SystemMetrics({ stats }: SystemMetricsProps) {
  const completedCount = stats.statusCounts["completed"] ?? 0;
  const pendingCount = stats.statusCounts["pending"] ?? 0;
  const failedCount = stats.statusCounts["scoring_failed"] ?? 0;
  const needsReviewCount = stats.statusCounts["needs_review"] ?? 0;

  const [reviewMeetings, setReviewMeetings] = useState<ReviewMeeting[] | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  async function toggleReviewMeetings() {
    if (reviewMeetings) {
      setReviewMeetings(null);
      return;
    }
    setLoadingReview(true);
    const { data } = await supabase
      .from("scored_meetings")
      .select("id, topic, host_name, start_time, status, error_message")
      .in("status", ["needs_review", "pending"])
      .order("start_time", { ascending: false });
    setReviewMeetings((data ?? []) as ReviewMeeting[]);
    setLoadingReview(false);
  }

  const metrics = [
    { label: "Total Meetings", value: stats.totalMeetings, description: "in scored_meetings table" },
    { label: "Completed", value: completedCount, description: "fully scored", color: "text-emerald-600 dark:text-emerald-400" },
    {
      label: "Needs Review",
      value: needsReviewCount + pendingCount,
      description: "click to view details",
      color: needsReviewCount + pendingCount > 0 ? "text-yellow-600 dark:text-yellow-400" : undefined,
      clickable: needsReviewCount + pendingCount > 0,
    },
    { label: "Failed", value: failedCount, description: "scoring_failed", color: failedCount > 0 ? "text-red-600 dark:text-red-400" : undefined },
    { label: "Embedded", value: stats.embeddedMeetings, description: "ready for RAG search" },
    { label: "Chunks", value: stats.totalChunks, description: "in meeting_chunks" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className={metric.clickable ? "cursor-pointer hover:border-primary/30 transition-colors" : ""}
            onClick={metric.clickable ? toggleReviewMeetings : undefined}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                {metric.clickable && (
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${reviewMeetings ? "rotate-180" : ""}`} />
                )}
              </div>
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

      {/* Expandable needs_review table */}
      {loadingReview && (
        <div className="text-sm text-muted-foreground px-2">Loading meetings...</div>
      )}
      {reviewMeetings && reviewMeetings.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-3">Meetings Needing Review</h4>
            <div className="space-y-2">
              {reviewMeetings.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{m.topic ?? "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.host_name} | {formatDate(m.start_time)} | Status: {m.status}
                    </p>
                    {m.error_message && (
                      <p className="text-xs text-destructive mt-0.5">{m.error_message}</p>
                    )}
                  </div>
                  <Link
                    href={`/meetings/${m.id}`}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
