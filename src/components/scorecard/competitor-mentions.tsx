"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { TRACKED_VENDORS } from "@/lib/constants";
import { BrandTooltip } from "@/components/shared/chart-tooltip";
import { ChartDownload } from "@/components/shared/chart-download";
import { Radar, ExternalLink, ChevronDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

interface VendorMention {
  vendor: string;
  meetingId: string;
  topic: string;
  hostName: string;
  companyName: string | null;
  stagetype: string | null;
  snippet: string;
}

export function CompetitorMentions() {
  const [mentions, setMentions] = useState<VendorMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  useEffect(() => {
    async function findMentions() {
    const results: VendorMention[] = [];

    for (const term of TRACKED_VENDORS) {
      const { data } = await supabase
        .from("meeting_chunks")
        .select("id, meeting_id, chunk_text, metadata")
        .ilike("chunk_text", `%${term}%`)
        .limit(5);

      if (data) {
        for (const chunk of data) {
          const meta = chunk.metadata as Record<string, unknown> | null;
          const stageType = meta?.scoring_stage_type as string ?? meta?.stage_type as string ?? null;

          // Skip internal meetings — only track vendor mentions in client calls
          if (stageType === "internal") continue;

          const text = chunk.chunk_text as string;
          const idx = text.toLowerCase().indexOf(term.toLowerCase());
          if (idx === -1) continue;
          const start = Math.max(0, idx - 50);
          const end = Math.min(text.length, idx + term.length + 50);
          const snippet = (start > 0 ? "..." : "") + text.slice(start, end).trim() + (end < text.length ? "..." : "");

          results.push({
            vendor: term,
            meetingId: meta?.meeting_id as string ?? chunk.meeting_id,
            topic: meta?.topic as string ?? "Unknown",
            hostName: meta?.host_name as string ?? "Unknown",
            companyName: meta?.company_name as string ?? null,
            stagetype: stageType,
            snippet,
          });
        }
      }
    }

    // Deduplicate by vendor + meetingId
    const seen = new Set<string>();
    const unique = results.filter((r) => {
      const key = `${r.vendor}-${r.meetingId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Only keep mentions from meetings with a company (external)
    const external = unique.filter((r) => r.companyName && r.companyName !== "");

    external.sort((a, b) => b.topic.localeCompare(a.topic));
    setMentions(external.slice(0, 12));
    setLoading(false);
    }
    findMentions();
  }, []);

  if (loading) return null;
  if (mentions.length === 0) return null;

  const grouped = new Map<string, VendorMention[]>();
  for (const m of mentions) {
    const list = grouped.get(m.vendor) ?? [];
    list.push(m);
    grouped.set(m.vendor, list);
  }

  // Sort by most mentions first
  const sortedEntries = Array.from(grouped.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  const chartData = sortedEntries.slice(0, 8).map(([vendor, items]) => ({
    name: vendor,
    mentions: items.length,
  }));

  const chartHeight = Math.max(120, chartData.length * 40 + 20);
  const selectedItems = selectedVendor ? grouped.get(selectedVendor) : null;

  // Gradient from deep blue (most mentions) to lighter blue (fewest)
  const getBarFill = (index: number) => {
    const lightness = 40 + index * 5; // 40% → 75% lightness
    return `hsl(217, 91%, ${Math.min(lightness, 72)}%)`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Radar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Tools & Vendor Mentions</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            from client meetings
          </span>
        </div>

        <ChartDownload title="Vendor Mentions">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<BrandTooltip />}
                cursor={{ fill: "transparent" }}
              />
              <Bar
                dataKey="mentions"
                name="Mentions"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(data: { name?: string }) => {
                  const vendor = data.name;
                  if (!vendor) return;
                  setSelectedVendor((prev) =>
                    prev === vendor ? null : vendor
                  );
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={
                      selectedVendor === entry.name
                        ? "#0B4BC2"
                        : getBarFill(index)
                    }
                    fillOpacity={
                      selectedVendor && selectedVendor !== entry.name
                        ? 0.3
                        : 1
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartDownload>

        {!selectedVendor && (
          <p className="text-xs font-medium text-primary/60 mt-2 flex items-center gap-1.5">
            <span className="inline-block h-1 w-1 rounded-full bg-primary/60" />
            Click a bar to see meeting details
          </p>
        )}

        {selectedVendor && selectedItems && (
          <div className="mt-3 rounded-lg border bg-muted/30 p-3">
            <button
              className="flex items-center gap-1.5 text-sm font-medium mb-2 hover:text-primary transition-colors w-full text-left"
              onClick={() => setSelectedVendor(null)}
            >
              <ChevronDown className="h-3.5 w-3.5" />
              {selectedVendor} ({selectedItems.length} mention
              {selectedItems.length !== 1 ? "s" : ""})
            </button>
            <div className="space-y-1.5">
              {selectedItems.map((item, i) => (
                <Link
                  key={i}
                  href={`/meetings/${item.meetingId}`}
                  className="flex items-start gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">
                    <span className="font-medium text-foreground">
                      {item.topic}
                    </span>
                    {item.companyName && ` (${item.companyName})`}
                    {" - "}
                    {item.snippet}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
