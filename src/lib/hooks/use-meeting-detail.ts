"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { ScoredMeetingRow } from "@/types/meetings";

export function useMeetingDetail(meetingId: string | null) {
  return useQuery({
    queryKey: ["meeting-detail", meetingId],
    queryFn: async (): Promise<ScoredMeetingRow | null> => {
      if (!meetingId) return null;

      const { data, error } = await supabase
        .from("scored_meetings")
        .select("*")
        .eq("id", meetingId)
        .single();

      if (error) throw error;
      return data as ScoredMeetingRow;
    },
    enabled: !!meetingId,
    staleTime: 5 * 60 * 1000,
  });
}
