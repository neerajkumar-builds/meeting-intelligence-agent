"use client";

import { SUGGESTED_PROMPTS } from "@/lib/constants";
import { Sparkles } from "lucide-react";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Animated AI icon */}
      <div className="relative mb-6">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#146DFA] to-[#146DFA]/60 flex items-center justify-center shadow-lg shadow-[#146DFA]/20">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-[#146DFA]/20 blur-xl animate-pulse" />
      </div>

      <h2 className="text-xl font-semibold mb-1">Meeting Intelligence</h2>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
        Search across all meeting transcripts, scores, and coaching insights with AI
      </p>

      <div className="grid gap-3 sm:grid-cols-2 max-w-2xl w-full">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            className="group rounded-xl border bg-card p-4 text-left text-sm text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground hover:shadow-sm"
          >
            <span className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary/40 group-hover:text-primary transition-colors" />
              {prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
