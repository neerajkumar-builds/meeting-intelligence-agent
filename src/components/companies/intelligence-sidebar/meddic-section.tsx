"use client";

import Link from "next/link";
import type { MeddicAnalysis, MeddicDimension } from "@/types/intelligence";
import { FRAMEWORKS, DISPLAY_FRAMEWORKS, type FrameworkKey } from "@/lib/constants";
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

interface RadarDataPoint {
  dimension: string;
  fullLabel: string;
  value: number;
  status: string;
}

function FrameworkTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RadarDataPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg">
      <p className="text-xs font-medium">{d.fullLabel}</p>
      <p className="text-[10px] text-muted-foreground">
        {d.status === "known" ? "Known" : d.status === "partial" ? "Partial" : "Missing"}
      </p>
    </div>
  );
}

function FrameworkPanel({
  frameworkKey,
  data,
  defaultOpen,
}: {
  frameworkKey: FrameworkKey;
  data: MeddicAnalysis;
  defaultOpen: boolean;
}) {
  const framework = FRAMEWORKS[frameworkKey];
  const dimMap = new Map(data.dimensions.map((d) => [d.key, d]));

  const mappedDimensions = framework.dimensions.map((fd) => {
    const source = dimMap.get(fd.meddicKey);
    return {
      ...fd,
      status: source?.status ?? ("missing" as const),
      evidence: source?.evidence ?? null,
      sourceMeetingId: source?.sourceMeetingId ?? null,
    };
  });

  const allMissing = mappedDimensions.every((d) => d.status === "missing");
  const knownCount = mappedDimensions.filter((d) => d.status === "known").length;
  const partialCount = mappedDimensions.filter((d) => d.status === "partial").length;
  const coverage = Math.round(((knownCount + partialCount * 0.5) / mappedDimensions.length) * 100);

  const radarData: RadarDataPoint[] = mappedDimensions.map((dim) => ({
    dimension: dim.label.length > 12 ? dim.label.slice(0, 10) + "..." : dim.label,
    fullLabel: dim.label,
    value: dim.status === "known" ? 100 : dim.status === "partial" ? 50 : 0,
    status: dim.status,
  }));

  return (
    <details className="group py-3" open={defaultOpen}>
      <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        {framework.label} Gaps
        <span className="text-[10px] font-normal normal-case text-foreground">
          {coverage}% coverage
        </span>
      </summary>
      <div className="mt-3">
        {allMissing ? (
          <p className="text-[10px] text-muted-foreground text-center py-4">
            No {framework.label} data discovered yet
          </p>
        ) : (
          <div className="mb-3">
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData} cx="50%" cy="50%">
                <PolarGrid strokeOpacity={0.3} />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9 }} />
                <Tooltip content={<FrameworkTooltip />} />
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

        <div className="space-y-2">
          {mappedDimensions.map((dim) => {
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

export function MeddicSection({ data }: { data: MeddicAnalysis }) {
  return (
    <>
      {DISPLAY_FRAMEWORKS.map((key, i) => (
        <FrameworkPanel key={key} frameworkKey={key} data={data} defaultOpen={i === 0} />
      ))}
    </>
  );
}
