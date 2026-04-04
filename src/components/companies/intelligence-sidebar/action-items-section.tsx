"use client";

import Link from "next/link";
import { ListChecks } from "lucide-react";
import type { ActionItem } from "@/types/intelligence";

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function ActionItemsSection({ items }: { items: ActionItem[] }) {
  return (
    <details className="group py-3 border-b">
      <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <span className="flex items-center gap-2">
          <ListChecks className="h-3 w-3" />
          Open Actions
        </span>
        {items.length > 0 && (
          <span className="text-[10px] font-normal">{items.length} items</span>
        )}
      </summary>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">No open action items</p>
      ) : (
        <div className="mt-2 space-y-2">
          {items.slice(0, 6).map((item, i) => (
            <Link
              key={i}
              href={`/meetings/${item.meetingId}`}
              className="block text-xs p-2 rounded-md border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="leading-snug">{item.action}</span>
                {item.priority && (
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_STYLES[item.priority]}`}>
                    {item.priority}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <span>{item.owner}</span>
                {item.deadline && <span>Due: {item.deadline}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </details>
  );
}
