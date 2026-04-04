"use client";

import Link from "next/link";
import { Radar } from "lucide-react";
import type { CompetitorMention } from "@/types/intelligence";

export function CompetitorSection({ mentions }: { mentions: CompetitorMention[] }) {
  return (
    <details className="group py-3 border-b">
      <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <span className="flex items-center gap-2">
          <Radar className="h-3 w-3" />
          Competitors
        </span>
        {mentions.length > 0 && (
          <span className="text-[10px] font-normal">{mentions.length} vendors</span>
        )}
      </summary>
      {mentions.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">No competitor mentions found</p>
      ) : (
        <div className="mt-2 space-y-2">
          {mentions.slice(0, 5).map((m) => (
            <div key={m.vendor} className="rounded-md border p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{m.vendor}</span>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {m.count}x
                </span>
              </div>
              {m.meetings.slice(0, 1).map((meeting, i) => (
                <Link
                  key={i}
                  href={`/meetings/${meeting.meetingId}`}
                  className="block text-[10px] text-muted-foreground hover:text-foreground line-clamp-2 transition-colors"
                >
                  {meeting.snippet}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </details>
  );
}
