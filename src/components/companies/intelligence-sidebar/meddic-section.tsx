"use client";

import Link from "next/link";
import type { MeddicAnalysis, MeddicDimension } from "@/types/intelligence";

const STATUS_INDICATOR: Record<MeddicDimension["status"], { className: string; label: string }> = {
  known: { className: "bg-emerald-500", label: "Known" },
  partial: { className: "bg-yellow-500 opacity-70", label: "Partial" },
  missing: { className: "border-2 border-gray-300 dark:border-gray-600", label: "Missing" },
};

export function MeddicSection({ data }: { data: MeddicAnalysis }) {
  return (
    <details className="group py-3">
      <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        MEDDIC Gaps
        <span className="text-[10px] font-normal normal-case text-foreground">
          {data.overallCoverage}% coverage
        </span>
      </summary>
      <div className="mt-3">
        {/* Coverage bar */}
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-[#146DFA] rounded-full transition-all duration-500"
            style={{ width: `${data.overallCoverage}%` }}
          />
        </div>

        {/* Dimension grid */}
        <div className="space-y-2">
          {data.dimensions.map((dim) => {
            const status = STATUS_INDICATOR[dim.status];
            return (
              <div key={dim.key} className="flex items-start gap-2.5">
                <div
                  className={`h-3 w-3 rounded-full shrink-0 mt-0.5 ${status.className}`}
                  title={status.label}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{dim.label}</span>
                    <span className="text-[10px] text-muted-foreground">{status.label}</span>
                  </div>
                  {dim.evidence ? (
                    dim.sourceMeetingId ? (
                      <Link
                        href={`/meetings/${dim.sourceMeetingId}`}
                        className="text-[10px] text-muted-foreground hover:text-foreground line-clamp-1 transition-colors"
                      >
                        {dim.evidence}
                      </Link>
                    ) : (
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {dim.evidence}
                      </p>
                    )
                  ) : (
                    <p className="text-[10px] text-muted-foreground">No data</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
}
