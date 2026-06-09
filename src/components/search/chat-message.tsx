"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Tooltip, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";
import { BrandTooltip } from "@/components/shared/chart-tooltip";
import { ChartDownload } from "@/components/shared/chart-download";
import { ChartErrorBoundary } from "./chart-error-boundary";
import { SendToSlack } from "@/components/shared/send-to-slack";
import { SourceCitation } from "./source-citation";
import { Copy, Mail, Check, Sparkles, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";
import { logChatEvent } from "@/lib/analytics";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  onFollowUp?: (question: string) => void;
  sessionId?: string;
  userEmail?: string;
}

/** Convert ```chart JSON blocks to readable text for copy/email/slack */
function chartBlocksToText(text: string): string {
  return text.replace(/```chart\n([\s\S]*?)```/g, (_match, json: string) => {
    try {
      const chart = JSON.parse(json.trim());
      const title = chart.title ? `${chart.title}:\n` : "";
      if (Array.isArray(chart.data)) {
        const rows = chart.data.map((d: { label: string; value: number }) => ` - ${d.label}: ${d.value}`).join("\n");
        return `${title}${rows}`;
      }
      return title.trim();
    } catch {
      return "[Chart data]";
    }
  });
}

/** Strip sources, followups, and convert charts to text - for export */
function getExportText(rawContent: string): string {
  let text = rawContent;
  text = text.replace(/```sources\n[\s\S]*?```/g, "");
  text = text.replace(/```followups\n[\s\S]*?```/g, "");
  text = chartBlocksToText(text);
  return text.trim();
}

/** Fix pipe tables where all rows are on a single line */
function fixSingleLineTables(text: string): string {
  return text.split("\n").map(line => {
    // Detect table separator: |---|---| pattern with 2+ columns
    const sepMatch = line.match(/\|(\s*:?-+:?\s*\|){2,}/);
    if (!sepMatch) return line;

    const sepStr = sepMatch[0];
    const sepIdx = line.indexOf(sepStr);
    const beforeSep = line.substring(0, sepIdx).trim();
    const rowsStr = line.substring(sepIdx + sepStr.length).trim();

    if (!beforeSep || !rowsStr || !beforeSep.includes("|")) return line;

    // Count columns from separator
    const colCount = sepStr.split("|").filter((s: string) => s.trim()).length;
    if (colCount < 2) return line;
    const pipesPerRow = colCount + 1;

    // Extract just the table header - count pipes backward from the separator
    // Title text like "Meeting Topics (April 2-3)" comes before the actual header pipes
    const headerPipes: number[] = [];
    for (let i = 0; i < beforeSep.length; i++) {
      if (beforeSep[i] === "|") headerPipes.push(i);
    }

    let titleText = "";
    let actualHeader = beforeSep;
    if (headerPipes.length >= pipesPerRow) {
      const headerStart = headerPipes[headerPipes.length - pipesPerRow];
      titleText = beforeSep.substring(0, headerStart).trim();
      actualHeader = beforeSep.substring(headerStart).trim();
    }

    // Split data rows by pipe counting - each row has pipesPerRow pipes
    const rowPipes: number[] = [];
    for (let i = 0; i < rowsStr.length; i++) {
      if (rowsStr[i] === "|") rowPipes.push(i);
    }

    const rows: string[] = [];
    for (let i = 0; i + pipesPerRow <= rowPipes.length; i += pipesPerRow) {
      rows.push(rowsStr.substring(rowPipes[i], rowPipes[i + pipesPerRow - 1] + 1).trim());
    }

    if (rows.length === 0) return line;

    // Build output - blank line between title and table so ReactMarkdown separates them
    const parts: string[] = [];
    if (titleText) parts.push(titleText, "");
    parts.push(actualHeader, sepStr.trim(), ...rows);
    return parts.join("\n");
  }).join("\n");
}

export function ChatMessage({ role, content, isStreaming, onFollowUp, sessionId, userEmail }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  function handleCopy() {
    navigator.clipboard.writeText(getExportText(content));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEmail() {
    window.open(`mailto:?body=${encodeURIComponent(getExportText(content))}`, "_blank");
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
            : content.startsWith("Something went wrong") || content.startsWith("No response received")
              ? "border border-destructive/30 bg-destructive/5"
              : "bg-muted"
        )}
      >
        {role === "assistant" && (content.startsWith("Something went wrong") || content.startsWith("No response received")) ? (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{content}</p>
          </div>
        ) : role === "assistant" ? (
          (() => {
            // Pre-process: ensure fenced code block markers are on their own line
            // Claude sometimes outputs ```chart or ```sources inline without a preceding newline
            let cleanContent = content.replace(/([^\n])(```)/g, "$1\n$2");

            // Extract sources block
            const sourcesMatch = cleanContent.match(/```sources\n([\s\S]*?)```/);
            let sources: { topic: string; rep: string; date: string; company?: string; id: string; score?: number }[] = [];
            if (sourcesMatch) {
              try {
                sources = JSON.parse(sourcesMatch[1].trim());
                cleanContent = cleanContent.replace(/```sources\n[\s\S]*?```/, "").trim();
              } catch {
                // Invalid sources JSON - ignore
              }
            }

            // Extract follow-up suggestions
            const followupsMatch = cleanContent.match(/```followups\n([\s\S]*?)```/);
            let followups: string[] = [];
            if (followupsMatch) {
              try {
                followups = JSON.parse(followupsMatch[1].trim());
                cleanContent = cleanContent.replace(/```followups\n[\s\S]*?```/, "").trim();
              } catch {
                // Invalid followups JSON - ignore
              }
            }

            // Fix pipe tables where all rows are on a single line
            cleanContent = fixSingleLineTables(cleanContent);

            return <>
            <div className="text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
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
                    // Detect chart blocks from the AI
                    if (className?.includes("language-chart")) {
                      // During streaming, chart JSON may be incomplete - show placeholder
                      if (isStreaming) {
                        return (
                          <div className="my-3 rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground flex items-center gap-2">
                            <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            Generating chart...
                          </div>
                        );
                      }
                      try {
                        const chartData = JSON.parse(String(children).trim());
                        if (Array.isArray(chartData.data)) {
                          chartData.data = chartData.data.map((d: Record<string, unknown>) => ({
                            ...d,
                            value: typeof d.value === "number" ? d.value : (parseFloat(String(d.value)) || 0),
                          }));
                        }
                        const CHART_COLORS = ["#146DFA", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#94a3b8", "#ec4899", "#06b6d4"];

                        if (chartData.type === "bar" && Array.isArray(chartData.data)) {
                          const maxVal = Math.max(...chartData.data.map((d: { value: number }) => d.value));
                          return (
                            <ChartErrorBoundary>
                            <ChartDownload title={chartData.title} className="my-3 rounded-lg border bg-card p-4">
                              {chartData.title && <p className="text-xs font-semibold mb-3">{chartData.title}</p>}
                              <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={chartData.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                  <YAxis domain={[0, Math.ceil(maxVal * 1.2)]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                  <Tooltip content={<BrandTooltip />} cursor={{ fill: "transparent" }} />
                                  <Bar dataKey="value" fill="#146DFA" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                              </ResponsiveContainer>
                            </ChartDownload>
                            </ChartErrorBoundary>
                          );
                        }

                        if (chartData.type === "donut" && Array.isArray(chartData.data)) {
                          return (
                            <ChartErrorBoundary>
                            <ChartDownload title={chartData.title} className="my-3 rounded-lg border bg-card p-4">
                              {chartData.title && <p className="text-xs font-semibold mb-3">{chartData.title}</p>}
                              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                <ResponsiveContainer width={120} height={120} className="sm:!w-[160px] sm:!h-[160px]">
                                  <PieChart>
                                    <Pie
                                      data={chartData.data}
                                      cx="50%" cy="50%"
                                      innerRadius={35} outerRadius={55}
                                      dataKey="value"
                                      nameKey="label"
                                      strokeWidth={2}
                                      stroke="hsl(var(--background))"
                                    >
                                      {chartData.data.map((_: unknown, i: number) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip content={<BrandTooltip />} />
                                  </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-1.5">
                                  {chartData.data.map((d: { label: string; value: number }, i: number) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                      <span className="text-muted-foreground">{d.label}</span>
                                      <span className="font-medium">{d.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </ChartDownload>
                            </ChartErrorBoundary>
                          );
                        }
                        if (chartData.type === "line" && Array.isArray(chartData.data)) {
                          return (
                            <ChartErrorBoundary>
                            <ChartDownload title={chartData.title} className="my-3 rounded-lg border bg-card p-4">
                              {chartData.title && <p className="text-xs font-semibold mb-3">{chartData.title}</p>}
                              <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={chartData.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                  <defs>
                                    <linearGradient id="chatLineGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#146DFA" stopOpacity={0.2} />
                                      <stop offset="95%" stopColor="#146DFA" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                  <Tooltip content={<BrandTooltip />} />
                                  <Area type="monotone" dataKey="value" stroke="#146DFA" strokeWidth={2} fill="url(#chatLineGrad)" dot={{ r: 3, fill: "#146DFA" }} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </ChartDownload>
                            </ChartErrorBoundary>
                          );
                        }
                      } catch {
                        return (
                          <div className="my-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 p-3 text-xs text-muted-foreground">
                            Chart data unavailable
                          </div>
                        );
                      }
                    }
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return (
                        <code className="block bg-zinc-900 dark:bg-zinc-950 text-emerald-400 rounded-md p-3 my-2 text-xs font-mono overflow-x-auto">
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
                {cleanContent}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-foreground/50 animate-pulse ml-0.5" />
              )}
            </div>

            {/* Action buttons - visible on hover */}
            {!isStreaming && content && (
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    handleCopy();
                    if (sessionId) logChatEvent({ sessionId, eventType: "copy", userEmail: userEmail ?? undefined });
                  }}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => {
                    handleEmail();
                    if (sessionId) logChatEvent({ sessionId, eventType: "email_share", userEmail: userEmail ?? undefined });
                  }}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
                >
                  <Mail className="h-3 w-3" />
                  Email
                </button>
                <SendToSlack title="Ask Blarney Response" body={getExportText(content)} />
                <div className="ml-auto flex items-center gap-0.5">
                  <button
                    onClick={() => {
                      setFeedback("up");
                      if (sessionId) logChatEvent({ sessionId, eventType: "thumbs_up", query: content.slice(0, 100), userEmail: userEmail ?? undefined });
                    }}
                    className={`rounded p-1 transition-colors ${feedback === "up" ? "text-emerald-500" : "text-muted-foreground/50 hover:text-emerald-500"}`}
                    disabled={feedback !== null}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      setFeedback("down");
                      if (sessionId) logChatEvent({ sessionId, eventType: "thumbs_down", query: content.slice(0, 100), userEmail: userEmail ?? undefined });
                    }}
                    className={`rounded p-1 transition-colors ${feedback === "down" ? "text-red-500" : "text-muted-foreground/50 hover:text-red-500"}`}
                    disabled={feedback !== null}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Source citations */}
            {sources.length > 0 && <SourceCitation sources={sources} />}

            {/* Follow-up suggestions */}
            {!isStreaming && followups.length > 0 && onFollowUp && (
              <div className="mt-3 pt-2 border-t border-border/30">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Follow-up
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {followups.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => onFollowUp(q)}
                      className="text-xs text-left px-2.5 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>;
          })()
        ) : (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  );
}
