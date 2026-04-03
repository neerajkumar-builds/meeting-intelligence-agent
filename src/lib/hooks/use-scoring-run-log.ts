"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { ScoringRunLogRow } from "@/types/meetings";

export function useScoringRunLog(limit = 20) {
  return useQuery({
    queryKey: ["scoring-run-log", limit],
    queryFn: async (): Promise<ScoringRunLogRow[]> => {
      const { data, error } = await supabase
        .from("scoring_run_log")
        .select("*")
        .order("run_started_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as ScoringRunLogRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
