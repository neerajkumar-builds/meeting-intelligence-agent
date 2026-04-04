"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { CircularGauge } from "@/components/shared/circular-gauge";
import type { HealthPulse } from "@/types/intelligence";

const TREND_CONFIG = {
  improving: { icon: TrendingUp, label: "Improving", color: "text-emerald-500" },
  declining: { icon: TrendingDown, label: "Declining", color: "text-red-500" },
  stable: { icon: Minus, label: "Stable", color: "text-yellow-500" },
  insufficient_data: { icon: Minus, label: "Not enough data", color: "text-muted-foreground" },
};

export function HealthPulseSection({ data }: { data: HealthPulse }) {
  const config = TREND_CONFIG[data.trend];
  const TrendIcon = config.icon;

  return (
    <details open className="group py-3 border-b">
      <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        Health Pulse
        <span className={`flex items-center gap-1 normal-case font-normal ${config.color}`}>
          <TrendIcon className="h-3 w-3" />
          {config.label}
        </span>
      </summary>
      <div className="mt-3 flex items-center gap-4">
        {data.currentScore !== null ? (
          <CircularGauge score={data.currentScore} label="Health" size={80} />
        ) : (
          <div className="text-sm text-muted-foreground">No health data</div>
        )}
        {data.previousScore !== null && data.currentScore !== null && (
          <div className="text-xs text-muted-foreground">
            <span className="block">Previous: {data.previousScore.toFixed(1)}</span>
            <span className={`block font-medium ${config.color}`}>
              {data.currentScore > data.previousScore ? "+" : ""}
              {(data.currentScore - data.previousScore).toFixed(1)} change
            </span>
          </div>
        )}
      </div>
    </details>
  );
}
