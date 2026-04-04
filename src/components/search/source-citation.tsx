"use client";

import Link from "next/link";
import { ScoreBadge } from "@/components/shared/score-badge";
import { ExternalLink } from "lucide-react";

interface Source {
  topic: string;
  rep: string;
  date: string;
  company?: string;
  id: string;
  score?: number;
}

export function SourceCitation({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Sources</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sources.map((source) => (
          <Link
            key={source.id}
            href={`/meetings/${source.id}`}
            className="flex-shrink-0 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs hover:bg-muted/50 hover:border-primary/30 transition-colors max-w-[240px]"
          >
            <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-medium truncate">{source.topic}</p>
              <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                <span>{source.rep}</span>
                {source.score != null && <ScoreBadge score={source.score} size="sm" />}
              </div>
              <p className="text-muted-foreground mt-0.5">
                {source.company ? `${source.company} · ` : ""}{source.date}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
