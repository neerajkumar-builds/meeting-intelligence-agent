"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { MeetingsListRow } from "@/types/meetings";

export interface MeetingsListParams {
  hostName?: string;
  companyName?: string;
  stageTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
  scoreMin?: number;
  scoreMax?: number;
  excludeInternal?: boolean;
}

export function useMeetingsList(params: MeetingsListParams = {}) {
  return useQuery({
    queryKey: ["meetings-list", params],
    queryFn: async (): Promise<MeetingsListRow[]> => {
      let query = supabase
        .from("meetings_list")
        .select("*")
        .order("start_time", { ascending: false });

      if (params.hostName) {
        query = query.eq("host_name", params.hostName);
      }
      if (params.companyName) {
        query = query.ilike("company_name", `%${params.companyName}%`);
      }
      if (params.stageTypes?.length) {
        query = query.in("scoring_stage_type", params.stageTypes);
      } else if (params.excludeInternal !== false) {
        query = query.not("scoring_stage_type", "in", "(internal,internal_client_meeting)");
      }
      if (params.dateFrom) {
        query = query.gte("start_time", params.dateFrom);
      }
      if (params.dateTo) {
        query = query.lte("start_time", params.dateTo);
      }
      if (params.scoreMin !== undefined) {
        query = query.gte("overall_score", params.scoreMin);
      }
      if (params.scoreMax !== undefined) {
        query = query.lte("overall_score", params.scoreMax);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as MeetingsListRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
