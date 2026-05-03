"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useSection } from "@/lib/section-context";
import type { MeetingsListRow } from "@/types/meetings";

export function useCompanyMeetings(companyName: string | null) {
  const { stageTypes } = useSection();

  return useQuery({
    queryKey: ["company-meetings", companyName, stageTypes],
    queryFn: async (): Promise<MeetingsListRow[]> => {
      if (!companyName) return [];

      const { data, error } = await supabase
        .from("meetings_list")
        .select("*")
        .eq("company_name", companyName)
        .in("scoring_stage_type", stageTypes)
        .order("start_time", { ascending: false });

      if (error) throw error;
      return (data ?? []) as MeetingsListRow[];
    },
    enabled: !!companyName,
    staleTime: 5 * 60 * 1000,
  });
}
