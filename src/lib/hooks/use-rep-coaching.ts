"use client";

import { useQuery } from "@tanstack/react-query";

export interface CoachingInsight {
  text: string;
  meetingId: string;
  topic: string;
}

export interface RepCoaching {
  meetingsAnalyzed: number;
  strengths: CoachingInsight[];
  improvements: CoachingInsight[];
  blindSpots: CoachingInsight[];
  recommendations: CoachingInsight[];
  dealProgressions: CoachingInsight[];
}

export function useRepCoaching(repName: string) {
  return useQuery({
    queryKey: ["rep-coaching", repName],
    queryFn: async (): Promise<RepCoaching | null> => {
      const res = await fetch(`/api/reps/${encodeURIComponent(repName)}/coaching`);
      if (!res.ok) throw new Error("Failed to fetch coaching data");
      const data = await res.json();
      return data.coaching ?? null;
    },
    enabled: !!repName,
    staleTime: 5 * 60 * 1000,
  });
}
