"use client";

import { useMemo } from "react";
import { FunnelChart, Funnel, Cell, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChartDownload } from "@/components/shared/chart-download";
import { BrandTooltip } from "@/components/shared/chart-tooltip";
import type { MeetingsListRow } from "@/types/meetings";

interface PipelineFunnelProps {
  meetings: MeetingsListRow[];
}

const FUNNEL_STAGES = [
  { key: "discovery_scoping", label: "Discovery", color: "#146DFA" },
  { key: "follow_up", label: "Follow-Up", color: "#8b5cf6" },
  { key: "onboarding", label: "Onboarding", color: "#10b981" },
];

export function PipelineFunnel({ meetings }: PipelineFunnelProps) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of meetings) {
      if (m.scoring_stage_type && m.scoring_stage_type !== "internal") {
        counts.set(m.scoring_stage_type, (counts.get(m.scoring_stage_type) ?? 0) + 1);
      }
    }

    return FUNNEL_STAGES
      .map((stage) => ({
        name: stage.label,
        value: counts.get(stage.key) ?? 0,
        color: stage.color,
      }))
      .filter((d) => d.value > 0);
  }, [meetings]);

  if (data.length < 2) return null;

  return (
    <Card>
      <ChartDownload title="Pipeline Funnel">
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4">Pipeline Funnel</h3>
        <ResponsiveContainer width="100%" height={200}>
          <FunnelChart>
            <Tooltip content={<BrandTooltip />} />
            <Funnel
              dataKey="value"
              data={data}
              isAnimationActive
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
              <LabelList
                dataKey="name"
                position="center"
                fill="#fff"
                fontSize={12}
                fontWeight={600}
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-medium">{d.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
      </ChartDownload>
    </Card>
  );
}
