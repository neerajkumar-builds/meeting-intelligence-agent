"use client";

import { useQuery } from "@tanstack/react-query";
import type { CompanyIntelligence } from "@/types/intelligence";

export function useCompanyIntelligence(companyName: string | null) {
  return useQuery({
    queryKey: ["company-intelligence", companyName],
    queryFn: async (): Promise<CompanyIntelligence | null> => {
      if (!companyName) return null;
      const res = await fetch(`/api/companies/${encodeURIComponent(companyName)}/intelligence`);
      if (!res.ok) throw new Error("Failed to fetch intelligence");
      return res.json();
    },
    enabled: !!companyName,
    staleTime: 5 * 60 * 1000,
  });
}
