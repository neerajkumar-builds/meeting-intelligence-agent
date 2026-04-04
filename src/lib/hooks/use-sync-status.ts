"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export interface SyncStatus {
  lastSyncAt: string | null;
  hoursAgo: number | null;
  pendingCount: number;
  status: "fresh" | "stale" | "critical" | "unknown";
  nextSyncEstimate: string | null;
}

const PIPELINE_INTERVAL_HOURS = Number(process.env.NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS) || 8;

export function useSyncStatus() {
  return useQuery({
    queryKey: ["sync-status"],
    queryFn: async (): Promise<SyncStatus> => {
      // Query 1: Most recent scored_at
      const { data: latest } = await supabase
        .from("scored_meetings")
        .select("scored_at")
        .not("scored_at", "is", null)
        .order("scored_at", { ascending: false })
        .limit(1);

      // Query 2: Pending meetings (captured but not scored)
      const { count } = await supabase
        .from("scored_meetings")
        .select("id", { count: "exact", head: true })
        .is("scored_at", null)
        .eq("status", "captured");

      const lastSyncAt = latest?.[0]?.scored_at ?? null;
      const pendingCount = count ?? 0;

      if (!lastSyncAt) {
        return { lastSyncAt: null, hoursAgo: null, pendingCount, status: "unknown", nextSyncEstimate: null };
      }

      const lastSyncDate = new Date(lastSyncAt);
      const hoursAgo = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);

      const status: SyncStatus["status"] =
        hoursAgo < PIPELINE_INTERVAL_HOURS ? "fresh" :
        hoursAgo < 24 ? "stale" :
        "critical";

      // Estimate next sync: last_sync + 8h
      const nextSync = new Date(lastSyncDate.getTime() + PIPELINE_INTERVAL_HOURS * 60 * 60 * 1000);
      const nextSyncEstimate = nextSync > new Date() ? nextSync.toISOString() : null;

      return { lastSyncAt, hoursAgo, pendingCount, status, nextSyncEstimate };
    },
    staleTime: 2 * 60 * 1000, // Refresh every 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });
}
