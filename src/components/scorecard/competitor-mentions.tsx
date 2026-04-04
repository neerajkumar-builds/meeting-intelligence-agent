"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { TRACKED_VENDORS } from "@/lib/constants";
import { Radar, ExternalLink } from "lucide-react";

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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedEntries.slice(0, 6).map(([vendor, items]) => (
            <div key={vendor} className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{vendor}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {items.length} mention{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1.5">
                {items.slice(0, 2).map((item, i) => (
                  <Link
                    key={i}
                    href={`/meetings/${item.meetingId}`}
                    className="flex items-start gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">
                      <span className="font-medium text-foreground">{item.topic}</span>
                      {item.companyName && ` (${item.companyName})`}
                      {" - "}{item.snippet}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
