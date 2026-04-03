"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
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
      health: m.client_health_score,
      score: m.overall_score,
    }));

  if (dataPoints.length < 2) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium mb-4">
          Relationship Health Over Time
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={dataPoints}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="health"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Health Score"
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Overall Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
