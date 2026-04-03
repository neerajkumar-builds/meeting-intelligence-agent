"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { BrandTooltip } from "@/components/shared/chart-tooltip";
import type { MeetingsListRow } from "@/types/meetings";
import { getStageLabel } from "@/lib/utils/stage";

interface StageDistributionProps {
  meetings: MeetingsListRow[];
}

const STAGE_COLORS: Record<string, string> = {
  discovery_scoping: "#146DFA",
  follow_up: "#8b5cf6",
  onboarding: "#10b981",
  internal: "#94a3b8",
};

export function StageDistribution({ meetings }: StageDistributionProps) {
  const stageCounts = new Map<string, number>();
  for (const m of meetings) {
    if (!m.scoring_stage_type) continue;
    stageCounts.set(m.scoring_stage_type, (stageCounts.get(m.scoring_stage_type) ?? 0) + 1);
  }

  const data = Array.from(stageCounts.entries())
    .map(([stage, count]) => ({
      name: getStageLabel(stage),
      value: count,
      color: STAGE_COLORS[stage] ?? "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  return (
    <Card className="flex-1">
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4">Meetings by Stage</h3>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <BrandTooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
                <span className="font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
