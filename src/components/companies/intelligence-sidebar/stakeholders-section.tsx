"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils/format";
import type { Stakeholder } from "@/types/intelligence";

export function StakeholdersSection({ stakeholders }: { stakeholders: Stakeholder[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? stakeholders : stakeholders.slice(0, 5);

  if (stakeholders.length === 0) {
    return (
      <details className="group py-3 border-b">
        <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
          <Users className="h-3 w-3" />
          Stakeholders
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">No participant data</p>
      </details>
    );
  }

  return (
    <details open className="group py-3 border-b">
      <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <span className="flex items-center gap-2">
          <Users className="h-3 w-3" />
          Stakeholders
        </span>
        <span className="text-[10px] font-normal">{stakeholders.length} people</span>
      </summary>
      <div className="mt-2 space-y-1.5">
        {visible.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-xs">
            <span className="font-medium truncate mr-2">{s.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px]">
                {s.meetingCount}x
              </span>
              <span className="text-muted-foreground text-[10px]">
                {formatRelativeDate(s.lastSeenDate)}
              </span>
            </div>
          </div>
        ))}
        {stakeholders.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] text-primary hover:underline"
          >
            {showAll ? "Show less" : `Show all ${stakeholders.length}`}
          </button>
        )}
      </div>
    </details>
  );
}
