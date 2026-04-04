"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit } from "lucide-react";
import type { CompanyIntelligence } from "@/types/intelligence";
import { HealthPulseSection } from "./health-pulse-section";
import { StakeholdersSection } from "./stakeholders-section";
import { DealStatusSection } from "./deal-status-section";
import { RiskSignalsSection } from "./risk-signals-section";
import { ActionItemsSection } from "./action-items-section";
import { CompetitorSection } from "./competitor-section";
import { MeddicSection } from "./meddic-section";

interface SidebarContentProps {
  data: CompanyIntelligence | null | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function SidebarContent({ data, isLoading, error }: SidebarContentProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-[#146DFA]" />
          <span className="text-sm font-semibold">Company Intelligence</span>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-destructive">Failed to load intelligence</p>
      </div>
    );
  }

  if (!data) return (
    <div className="p-4 text-center">
      <p className="text-sm text-muted-foreground">No intelligence data yet.</p>
      <p className="text-xs text-muted-foreground mt-1">This company needs more scored meetings for AI analysis.</p>
    </div>
  );

  return (
    <div className="p-4 space-y-1">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <BrainCircuit className="h-4 w-4 text-[#146DFA]" />
        <span className="text-sm font-semibold">Company Intelligence</span>
      </div>

      <HealthPulseSection data={data.healthPulse} />
      <StakeholdersSection stakeholders={data.stakeholders} />
      <DealStatusSection data={data.dealStatus} />
      <RiskSignalsSection data={data.riskSignals} />
      <ActionItemsSection items={data.openActionItems} />
      <CompetitorSection mentions={data.competitorMentions} />
      <MeddicSection data={data.meddicGaps} />
    </div>
  );
}
