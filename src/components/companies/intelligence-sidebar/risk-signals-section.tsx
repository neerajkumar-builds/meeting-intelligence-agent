"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { RiskSignals } from "@/types/intelligence";

export function RiskSignalsSection({ data }: { data: RiskSignals }) {
  const hasAny = data.churnSignals.length > 0 || data.expansionSignals.length > 0;

  return (
    <details className="group py-3 border-b">
      <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        Risk Signals
        {data.churnSignals.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-red-500 font-normal normal-case">
            <AlertTriangle className="h-2.5 w-2.5" />
            {data.churnSignals.length} risk{data.churnSignals.length !== 1 ? "s" : ""}
          </span>
        )}
      </summary>
      {!hasAny ? (
        <p className="mt-2 text-xs text-muted-foreground">No signals detected</p>
      ) : (
        <div className="mt-2 space-y-3">
          {data.churnSignals.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-red-500 mb-1">Churn Risks</p>
              <div className="space-y-1">
                {data.churnSignals.slice(0, 4).map((s, i) => (
                  <Link
                    key={i}
                    href={`/meetings/${s.meetingId}`}
                    className="block text-xs text-muted-foreground hover:text-foreground rounded px-2 py-1 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 transition-colors"
                  >
                    {s.signal}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {data.expansionSignals.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-emerald-500 mb-1">Expansion Signals</p>
              <div className="space-y-1">
                {data.expansionSignals.slice(0, 4).map((s, i) => (
                  <Link
                    key={i}
                    href={`/meetings/${s.meetingId}`}
                    className="block text-xs text-muted-foreground hover:text-foreground rounded px-2 py-1 border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950 transition-colors"
                  >
                    {s.signal}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </details>
  );
}
