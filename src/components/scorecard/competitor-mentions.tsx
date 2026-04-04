"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { COMPETITORS } from "@/lib/constants";
import { Swords, ExternalLink } from "lucide-react";

interface CompetitorMention {
  competitor: string;
  meetingId: string;
  topic: string;
  hostName: string;
  companyName: string | null;
  startTime: string;
  snippet: string;
}

export function CompetitorMentions() {
  const [mentions, setMentions] = useState<CompetitorMention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    findMentions();
  }, []);

  async function findMentions() {
    // Search transcript chunks for competitor names
    const results: CompetitorMention[] = [];

    // Batch search — query chunks that contain any competitor name
    // Use a broad ILIKE search for efficiency
    const searchTerms = COMPETITORS.slice(0, 15); // Top 15 to avoid huge queries

    for (const term of searchTerms) {
      const { data } = await supabase
        .from("meeting_chunks")
        .select("id, meeting_id, chunk_text, metadata")
        .ilike("chunk_text", `%${term}%`)
        .limit(3);

      if (data) {
        for (const chunk of data) {
          const meta = chunk.metadata as Record<string, unknown> | null;
          // Extract a short snippet around the mention
          const text = chunk.chunk_text as string;
          const idx = text.toLowerCase().indexOf(term.toLowerCase());
          const start = Math.max(0, idx - 60);
          const end = Math.min(text.length, idx + term.length + 60);
          const snippet = (start > 0 ? "..." : "") + text.slice(start, end).trim() + (end < text.length ? "..." : "");

          results.push({
            competitor: term,
            meetingId: meta?.meeting_id as string ?? chunk.meeting_id,
            topic: meta?.topic as string ?? "Unknown",
            hostName: meta?.host_name as string ?? "Unknown",
            companyName: meta?.company_name as string ?? null,
            startTime: meta?.start_time as string ?? "",
            snippet,
          });
        }
      }
    }

    // Deduplicate by competitor + meetingId
    const seen = new Set<string>();
    const unique = results.filter((r) => {
      const key = `${r.competitor}-${r.meetingId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by most recent
    unique.sort((a, b) => (b.startTime ?? "").localeCompare(a.startTime ?? ""));

    setMentions(unique.slice(0, 10));
    setLoading(false);
  }

  if (loading) return null;
  if (mentions.length === 0) return null;

  // Group by competitor
  const grouped = new Map<string, CompetitorMention[]>();
  for (const m of mentions) {
    const list = grouped.get(m.competitor) ?? [];
    list.push(m);
    grouped.set(m.competitor, list);
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Swords className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Competitor Mentions</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {mentions.length} mention{mentions.length !== 1 ? "s" : ""} found
          </span>
        </div>

        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([competitor, items]) => (
            <div key={competitor} className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{competitor}</span>
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
                      {" — "}{item.snippet}
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
