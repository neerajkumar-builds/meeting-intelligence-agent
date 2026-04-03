"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export interface PipelineStats {
  statusCounts: Record<string, number>;
  totalMeetings: number;
  totalChunks: number;
  embeddedMeetings: number;
}

export function usePipelineStats() {
  return useQuery({
    queryKey: ["pipeline-stats"],
    queryFn: async (): Promise<PipelineStats> => {
      // Get status counts from scored_meetings
      const { data: meetings, error: meetingsErr } = await supabase
        .from("scored_meetings")
        .select("status, embedded_at");

      if (meetingsErr) throw meetingsErr;

      const statusCounts: Record<string, number> = {};
      let embeddedMeetings = 0;
      for (const m of meetings ?? []) {
        statusCounts[m.status] = (statusCounts[m.status] ?? 0) + 1;
        if (m.embedded_at) embeddedMeetings++;
      }

      // Get chunk count
      const { count: totalChunks, error: chunksErr } = await supabase
        .from("meeting_chunks")
        .select("id", { count: "exact", head: true });

      if (chunksErr) throw chunksErr;

      return {
        statusCounts,
        totalMeetings: meetings?.length ?? 0,
        totalChunks: totalChunks ?? 0,
        embeddedMeetings,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
