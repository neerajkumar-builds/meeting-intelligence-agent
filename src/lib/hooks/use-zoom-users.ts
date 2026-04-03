"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { ZoomUserRow } from "@/types/meetings";

export function useZoomUsers(enabledOnly = true) {
  return useQuery({
    queryKey: ["zoom-users", enabledOnly],
    queryFn: async (): Promise<ZoomUserRow[]> => {
      let query = supabase
        .from("zoom_users")
        .select("*")
        .order("display_name");

      if (enabledOnly) {
        query = query.eq("enabled_for_scoring", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ZoomUserRow[];
    },
    staleTime: 30 * 60 * 1000, // 30 min — rep list rarely changes
  });
}
