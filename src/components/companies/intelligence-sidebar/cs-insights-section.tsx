"use client";

import { ScoreBadge } from "@/components/shared/score-badge";
import { formatDate } from "@/lib/utils/format";
import type { CSInsights } from "@/types/intelligence";

function SignalDot({ active, label, variant }: { active: boolean; label: string; variant: "red" | "green" | "amber" }) {
  if (!active) return null;
  const colors = {
    red: "bg-red-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
  };
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${colors[variant]}`} />
      {label}
    </span>
  );
}

export function CSInsightsSection({ data }: { data: CSInsights | null }) {
  if (!data) return null;

  const signals = data.strategicSignals;

  return (
    <details className="group py-3 border-b" open>
      <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        CS Health
        {data.latestHealthScore != null && (
          <ScoreBadge score={data.latestHealthScore} size="sm" />
        )}
      </summary>
      <div className="mt-2 space-y-2">
        {data.sentimentScore != null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Sentiment</span>
            <ScoreBadge score={data.sentimentScore} size="sm" />
          </div>
        )}
        {data.escalationRisk && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Escalation Risk</span>
            <span className={`font-medium ${data.escalationRisk === "high" ? "text-red-500" : data.escalationRisk === "medium" ? "text-amber-500" : "text-emerald-500"}`}>
              {data.escalationRisk}
            </span>
          </div>
        )}
        {data.expansionLikelihood && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Expansion</span>
            <span className={`font-medium ${data.expansionLikelihood === "high" ? "text-emerald-500" : data.expansionLikelihood === "medium" ? "text-amber-500" : "text-muted-foreground"}`}>
              {data.expansionLikelihood}
            </span>
          </div>
        )}
        {signals && (
          <div className="flex flex-wrap gap-2 pt-1">
            <SignalDot active={signals.renewalRisk} label="Renewal risk" variant="red" />
            <SignalDot active={signals.expansionOpportunity} label="Expansion" variant="green" />
            <SignalDot active={signals.stakeholderMisalignment} label="Misalignment" variant="amber" />
            <SignalDot active={signals.adoptionConcerns} label="Adoption risk" variant="amber" />
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          From: {data.fromMeetingTopic} ({formatDate(data.fromMeetingDate)})
        </p>
      </div>
    </details>
  );
}
