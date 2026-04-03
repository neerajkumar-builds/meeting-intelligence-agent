"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { BrandTooltip } from "@/components/shared/chart-tooltip";
import type { MeetingsListRow } from "@/types/meetings";

interface ScoreDistributionChartProps {
  meetings: MeetingsListRow[];
}

export function ScoreDistributionChart({ meetings }: ScoreDistributionChartProps) {
  const repBands = new Map<string, { high: number; medium: number; low: number }>();

  for (const m of meetings) {
    if (!m.host_name || m.overall_score === null) continue;
    const bands = repBands.get(m.host_name) ?? { high: 0, medium: 0, low: 0 };
    if (m.overall_score >= 8) bands.high++;
    else if (m.overall_score >= 6) bands.medium++;
    else bands.low++;
    repBands.set(m.host_name, bands);
  }

  const data = Array.from(repBands.entries())
    .map(([name, bands]) => ({
      name: name.split(" ")[0],
      "8+ Strong": bands.high,
      "6-7.9 Mid": bands.medium,
      "<6 Low": bands.low,
      total: bands.high + bands.medium + bands.low,
    }))
    .sort((a, b) => b.total - a.total);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4">Score Distribution by Rep</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <BrandTooltip />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} iconType="circle" iconSize={8} />
            <Bar dataKey="8+ Strong" stackId="score" fill="#146DFA" radius={[0, 0, 0, 0]} />
            <Bar dataKey="6-7.9 Mid" stackId="score" fill="#93b4f5" radius={[0, 0, 0, 0]} />
            <Bar dataKey="<6 Low" stackId="score" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
