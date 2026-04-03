"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Copy, Mail, Check } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEmail() {
    window.open(`mailto:?body=${encodeURIComponent(content)}`, "_blank");
  }

  return (
    <div
      className={cn(
        "group flex gap-3 py-4",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "relative max-w-[85%] rounded-lg px-4 py-3",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {role === "assistant" ? (
          <>
            <div className="text-sm leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-3 last:mb-0">{children}</p>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold mt-4 mb-2 pb-1 border-b border-border">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold mt-3 mb-1.5">
                      {children}
                    </h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-3 ml-4 space-y-1 list-disc marker:text-muted-foreground">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 ml-4 space-y-1 list-decimal marker:text-muted-foreground">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return (
                        <code className="block bg-[#0A0A0A] text-emerald-400 rounded-md p-3 my-2 text-xs font-mono overflow-x-auto">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="mb-3">{children}</pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-primary/50 pl-3 my-3 text-muted-foreground italic">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded border">
                      <table className="w-full text-xs">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border-b bg-muted px-3 py-1.5 text-left font-medium">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border-b px-3 py-1.5">{children}</td>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-foreground/50 animate-pulse ml-0.5" />
              )}
            </div>

            {/* Action buttons — visible on hover */}
            {!isStreaming && content && (
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={handleEmail}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
                >
                  <Mail className="h-3 w-3" />
                  Email
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  );
}
