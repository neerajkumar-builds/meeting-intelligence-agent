"use client";

import { SUGGESTED_PROMPTS } from "@/lib/constants";
import { Search } from "lucide-react";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <h2 className="text-lg font-medium mb-1">Meeting Intelligence Search</h2>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
        Ask questions about meeting transcripts, scores, action items, and coaching insights.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 max-w-2xl w-full">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            className="rounded-lg border bg-card p-3 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
