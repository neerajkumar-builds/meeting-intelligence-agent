"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useSyncStatus } from "@/lib/hooks/use-sync-status";
import { formatRelativeDate } from "@/lib/utils/format";
import { Clock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

const STATUS_CONFIG = {
  fresh: { icon: CheckCircle2, label: "Pipeline Healthy", bg: "border-emerald-200 dark:border-emerald-800", iconColor: "text-emerald-500" },
  stale: { icon: AlertTriangle, label: "Pipeline May Need Attention", bg: "border-yellow-200 dark:border-yellow-800", iconColor: "text-yellow-500" },
  critical: { icon: AlertTriangle, label: "Pipeline Overdue", bg: "border-red-200 dark:border-red-800", iconColor: "text-red-500" },
  unknown: { icon: Clock, label: "No Sync Data", bg: "border-border", iconColor: "text-muted-foreground" },
};

const N8N_WORKFLOWS = [
  { name: "MI|0 — Token Service", schedule: "On-demand" },
  { name: "MI|1 — Capture Meetings + Sync Users", schedule: "8hr + Weekly" },
  { name: "MI|2 — Transcript + Enrich", schedule: "8hr" },
  { name: "MI|3 — Score Meetings (4-LLM)", schedule: "8hr" },
  { name: "MI|4 — Chunk + Embed (RAG)", schedule: "8hr" },
];

export function PipelineStatus() {
  const { data, isLoading } = useSyncStatus();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Checking pipeline status...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const config = STATUS_CONFIG[data.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-3">
      {/* Status banner */}
      <Card className={config.bg}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <StatusIcon className={`h-5 w-5 ${config.iconColor}`} />
            <span className="text-sm font-semibold">{config.label}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Sync</p>
              <p className="text-sm font-medium mt-0.5">
                {data.lastSyncAt ? formatRelativeDate(data.lastSyncAt) : "Never"}
              </p>
              {data.lastSyncAt && (
                <p className="text-[10px] text-muted-foreground">
                  {new Date(data.lastSyncAt).toLocaleString()}
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Next Sync (est.)</p>
              <p className="text-sm font-medium mt-0.5">
                {data.nextSyncEstimate ? formatRelativeDate(data.nextSyncEstimate) : "Overdue"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
              <p className="text-sm font-medium mt-0.5">
                {data.pendingCount} meeting{data.pendingCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* n8n workflow reference */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold mb-2">n8n Pipeline Workflows</p>
          <div className="space-y-1">
            {N8N_WORKFLOWS.map((wf) => (
              <div key={wf.name} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{wf.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{wf.schedule}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
