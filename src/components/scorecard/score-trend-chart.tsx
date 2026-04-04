"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChartDownload } from "@/components/shared/chart-download";
import { BrandTooltip } from "@/components/shared/chart-tooltip";
import type { MeetingsListRow } from "@/types/meetings";
import { parseISO, startOfWeek, format } from "date-fns";

interface ScoreTrendChartProps {
  meetings: MeetingsListRow[];
}

export function ScoreTrendChart({ meetings }: ScoreTrendChartProps) {
  const weeklyData = new Map<string, { total: number; count: number }>();

  for (const m of meetings) {
    if (!m.start_time || m.overall_score === null) continue;
    const week = format(startOfWeek(parseISO(m.start_time), { weekStartsOn: 1 }), "MMM d");
    const entry = weeklyData.get(week) ?? { total: 0, count: 0 };
    entry.total += m.overall_score;
    entry.count += 1;
    weeklyData.set(week, entry);
  }

  const data = Array.from(weeklyData.entries())
    .map(([week, { total, count }]) => ({
      week,
      "Avg Score": parseFloat((total / count).toFixed(1)),
      meetings: count,
    }));

  if (data.length < 2) return null;

  return (
    <Card className="flex-1">
      <ChartDownload title="Score Trend">
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4">Score Trend (Weekly Avg)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#146DFA" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#146DFA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<BrandTooltip />} />
            <Area
              type="monotone"
              dataKey="Avg Score"
              stroke="#146DFA"
              strokeWidth={2}
              fill="url(#trendGrad)"
              dot={{ r: 3, fill: "#146DFA" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
      </ChartDownload>
    </Card>
  );
}
