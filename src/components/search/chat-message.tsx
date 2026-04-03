"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex gap-3 py-4",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-4 py-3",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {role === "assistant" ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-foreground/50 animate-pulse ml-0.5" />
            )}
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  );
}
