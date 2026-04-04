"use client";

import {
  Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  AreaChart, Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { BrandTooltip } from "@/components/shared/chart-tooltip";
import type { MeetingsListRow } from "@/types/meetings";
import { format, parseISO } from "date-fns";

interface HealthTrendChartProps {
  meetings: MeetingsListRow[];
}

export function HealthTrendChart({ meetings }: HealthTrendChartProps) {
  const dataPoints = meetings
    .filter((m) => m.client_health_score !== null && m.start_time)
    .sort(
      (a, b) =>
        new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime()
    )
    .map((m) => ({
      date: format(parseISO(m.start_time!), "MMM d"),
      "Health Score": m.client_health_score,
      "Overall Score": m.overall_score,
    }));

  if (dataPoints.length < 2) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4">
          Relationship Health Over Time
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={dataPoints}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#146DFA" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#146DFA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<BrandTooltip />} />
            <Area
              type="monotone"
              dataKey="Health Score"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#healthGradient)"
              dot={{ r: 4, fill: "#10b981" }}
              activeDot={{ r: 6 }}
            />
            <Area
              type="monotone"
              dataKey="Overall Score"
              stroke="#146DFA"
              strokeWidth={2}
              fill="url(#scoreGradient)"
              dot={{ r: 4, fill: "#146DFA" }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
