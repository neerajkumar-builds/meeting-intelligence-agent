"use client";

import Link from "next/link";
import { useSyncStatus } from "@/lib/hooks/use-sync-status";

const STATUS_STYLES = {
  fresh: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  stale: { dot: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-400" },
  critical: { dot: "bg-red-500 animate-pulse", text: "text-red-600 dark:text-red-400" },
  unknown: { dot: "bg-gray-400", text: "text-muted-foreground" },
};

function formatHoursAgo(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function SyncIndicator() {
  const { data, isLoading } = useSyncStatus();

  if (isLoading || !data) return null;

  const styles = STATUS_STYLES[data.status];

  return (
    <Link
      href="/health"
      className="hidden md:inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] hover:bg-muted transition-colors"
      title={data.lastSyncAt ? `Last sync: ${new Date(data.lastSyncAt).toLocaleString()}` : "No sync data"}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`} />
      <span className={styles.text}>
        {data.hoursAgo !== null ? `Synced ${formatHoursAgo(data.hoursAgo)}` : "No sync"}
      </span>
      {data.pendingCount > 0 && (
        <span className="text-muted-foreground">({data.pendingCount} pending)</span>
      )}
    </Link>
  );
}
