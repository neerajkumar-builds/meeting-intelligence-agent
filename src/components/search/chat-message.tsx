"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Tooltip, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";
import { BrandTooltip } from "@/components/shared/chart-tooltip";
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
                    // Detect chart blocks from the AI
                    if (className?.includes("language-chart")) {
                      try {
                        const chartData = JSON.parse(String(children).trim());
                        const CHART_COLORS = ["#146DFA", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#94a3b8", "#ec4899", "#06b6d4"];

                        if (chartData.type === "bar" && Array.isArray(chartData.data)) {
                          const maxVal = Math.max(...chartData.data.map((d: { value: number }) => d.value));
                          return (
                            <div className="my-3 rounded-lg border bg-card p-4">
                              {chartData.title && <p className="text-xs font-semibold mb-3">{chartData.title}</p>}
                              <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={chartData.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                  <YAxis domain={[0, Math.ceil(maxVal * 1.2)]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                  <Tooltip content={<BrandTooltip />} />
                                  <Bar dataKey="value" fill="#146DFA" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          );
                        }

                        if (chartData.type === "donut" && Array.isArray(chartData.data)) {
                          return (
                            <div className="my-3 rounded-lg border bg-card p-4">
                              {chartData.title && <p className="text-xs font-semibold mb-3">{chartData.title}</p>}
                              <div className="flex items-center gap-6">
                                <ResponsiveContainer width={160} height={160}>
                                  <PieChart>
                                    <Pie
                                      data={chartData.data}
                                      cx="50%" cy="50%"
                                      innerRadius={45} outerRadius={70}
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
                            </div>
                          );
                        }
                        if (chartData.type === "line" && Array.isArray(chartData.data)) {
                          return (
                            <div className="my-3 rounded-lg border bg-card p-4">
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
                            </div>
                          );
                        }
                      } catch {
                        // Invalid JSON — fall through to code block
                      }
                    }
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
