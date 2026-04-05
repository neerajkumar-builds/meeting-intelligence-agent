"use client";

import { useQuery } from "@tanstack/react-query";

export interface InternalActionItem {
  action: string;
  owner: string;
  priority?: string;
  deadline?: string;
  meetingId: string;
  topic: string;
}

export interface InternalDecision {
  decision: string;
  meetingId: string;
  topic: string;
}

export interface InternalClientRef {
  clientName: string;
  sentiment: string;
  context: string;
  meetingId: string;
  topic: string;
}

export interface RepInternalInsights {
  meetingsAnalyzed: number;
  actionItems: InternalActionItem[];
  decisions: InternalDecision[];
  clientRefs: InternalClientRef[];
}

export function useRepInternalInsights(repName: string) {
  return useQuery({
    queryKey: ["rep-internal-insights", repName],
    queryFn: async (): Promise<RepInternalInsights | null> => {
      const res = await fetch(`/api/reps/${encodeURIComponent(repName)}/internal-insights`);
      if (!res.ok) throw new Error("Failed to fetch internal insights");
      const data = await res.json();
      return data.insights ?? null;
    },
    enabled: !!repName,
    staleTime: 5 * 60 * 1000,
  });
}
