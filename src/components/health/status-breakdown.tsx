"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface StatusBreakdownProps {
  statusCounts: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#10b981",
  enriched: "#6366f1",
  pending: "#f59e0b",
  needs_review: "#f97316",
  scoring_failed: "#ef4444",
  skipped_short: "#94a3b8",
  skipped_internal: "#94a3b8",
  test_archived: "#64748b",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  enriched: "Enriched",
  pending: "Pending",
  needs_review: "Needs Review",
  scoring_failed: "Failed",
  skipped_short: "Skipped (Short)",
  skipped_internal: "Skipped (Internal)",
  test_archived: "Archived",
};

export function StatusBreakdown({ statusCounts }: StatusBreakdownProps) {
  const data = Object.entries(statusCounts)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status] ?? status,
      value: count,
      color: STATUS_COLORS[status] ?? "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium mb-4">Meetings by Status</h3>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">
                  {entry.name}: <span className="font-medium">{entry.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
