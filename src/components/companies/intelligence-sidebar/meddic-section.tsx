"use client";

import Link from "next/link";
import type { MeddicAnalysis, MeddicDimension } from "@/types/intelligence";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const STATUS_INDICATOR: Record<MeddicDimension["status"], { className: string; label: string }> = {
  known: { className: "bg-emerald-500", label: "Known" },
  partial: { className: "bg-yellow-500 opacity-70", label: "Partial" },
  missing: { className: "border-2 border-gray-300 dark:border-gray-600", label: "Missing" },
};

const SHORT_LABELS: Record<string, string> = {
  "Economic Buyer": "Econ. Buyer",
  "Decision Criteria": "Dec. Criteria",
  "Decision Process": "Dec. Process",
  "Identify Pain": "Pain",
};

interface RadarDataPoint {
  dimension: string;
  fullLabel: string;
  value: number;
  status: string;
}

function MeddicTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RadarDataPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const statusLabel =
    d.status === "known"
      ? "Known"
      : d.status === "partial"
        ? "Partial"
        : "Missing";
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg">
      <p className="text-xs font-medium">{d.fullLabel}</p>
      <p className="text-[10px] text-muted-foreground">{statusLabel}</p>
    </div>
  );
}

export function MeddicSection({ data }: { data: MeddicAnalysis }) {
  const allMissing = data.dimensions.every((d) => d.status === "missing");
  const radarData: RadarDataPoint[] = data.dimensions.map((dim) => ({
    dimension: SHORT_LABELS[dim.label] ?? dim.label,
    fullLabel: dim.label,
    value: dim.status === "known" ? 100 : dim.status === "partial" ? 50 : 0,
    status: dim.status,
  }));

  return (
    <details className="group py-3">
      <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        MEDDIC Gaps
        <span className="text-[10px] font-normal normal-case text-foreground">
          {data.overallCoverage}% coverage
        </span>
      </summary>
      <div className="mt-3">
        {/* Radar chart */}
        {allMissing ? (
          <p className="text-[10px] text-muted-foreground text-center py-4">
            No MEDDIC data discovered yet
          </p>
        ) : (
          <div className="mb-3">
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData} cx="50%" cy="50%">
                <PolarGrid strokeOpacity={0.3} />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 9 }}
                />
                <Tooltip content={<MeddicTooltip />} />
                <Radar
                  dataKey="value"
                  fill="#146DFA"
                  fillOpacity={0.3}
                  stroke="#146DFA"
                  strokeWidth={1.5}
                  dot={{ r: 3, fill: "#146DFA" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

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
