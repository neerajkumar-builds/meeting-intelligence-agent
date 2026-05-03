"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRepInternalInsights } from "@/lib/hooks/use-rep-internal-insights";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckSquare, GitBranch, Users, ExternalLink, Sparkles } from "lucide-react";

interface InternalInsightsSummaryProps {
  repName: string;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-emerald-500",
  neutral: "text-muted-foreground",
  negative: "text-red-500",
  mixed: "text-amber-500",
  concerned: "text-amber-500",
  at_risk: "text-red-500",
};

/** Replace em dashes - display only */
function cleanText(text: string): string {
  return text.replace(/\u2014/g, " - ").replace(/ -/g, " - ");
}

export function InternalInsightsSummary({ repName }: InternalInsightsSummaryProps) {
  const { data: insights, isLoading, error } = useRepInternalInsights(repName);
  const [modalView, setModalView] = useState<"actions" | "decisions" | "clients" | null>(null);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (error || !insights) return null;
  const { actionItems, decisions, clientRefs, meetingsAnalyzed } = insights;
  if (actionItems.length === 0 && decisions.length === 0 && clientRefs.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Internal Meeting Insights <span className="normal-case tracking-normal opacity-60">· {meetingsAnalyzed} meetings analyzed</span>
      </h3>
      <div className="grid gap-3 md:grid-cols-3">
        {/* Action Items */}
        {actionItems.length > 0 && (
          <Card className="border-l-4 border-l-blue-500 overflow-hidden">
            <CardContent className="px-4 py-3 bg-blue-500/5">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-blue-500" />
                <p className="text-xs font-semibold">Action Items</p>
                <button onClick={() => setModalView("actions")} className="text-[10px] text-primary hover:underline ml-auto">
                  {actionItems.length} items
                </button>
              </div>
              <ul className="space-y-1">
                {actionItems.slice(0, 2).map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">{item.owner}</span>: {cleanText(item.action).slice(0, 80)}{item.action.length > 80 ? "..." : ""}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Decisions */}
        {decisions.length > 0 && (
          <Card className="border-l-4 border-l-purple-500 overflow-hidden">
            <CardContent className="px-4 py-3 bg-purple-500/5">
              <div className="flex items-center gap-2 mb-1.5">
                <GitBranch className="h-3.5 w-3.5 text-purple-500" />
                <p className="text-xs font-semibold">Decisions</p>
                <button onClick={() => setModalView("decisions")} className="text-[10px] text-primary hover:underline ml-auto">
                  {decisions.length} items
                </button>
              </div>
              <ul className="space-y-1">
                {decisions.slice(0, 2).map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                    {cleanText(item.decision).slice(0, 100)}{item.decision.length > 100 ? "..." : ""}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Client References */}
        {clientRefs.length > 0 && (
          <Card className="border-l-4 border-l-emerald-500 overflow-hidden">
            <CardContent className="px-4 py-3 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-500" />
                <p className="text-xs font-semibold">Client References</p>
                <button onClick={() => setModalView("clients")} className="text-[10px] text-primary hover:underline ml-auto">
                  {clientRefs.length} refs
                </button>
              </div>
              <ul className="space-y-1">
                {clientRefs.slice(0, 2).map((item, i) => (
                  <li key={i} className="text-xs leading-relaxed">
                    <span className={`font-medium ${SENTIMENT_COLORS[item.sentiment] ?? "text-muted-foreground"}`}>{item.clientName}</span>
                    <span className="text-muted-foreground"> - {cleanText(item.context).slice(0, 60)}{item.context.length > 60 ? "..." : ""}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <Dialog open={modalView !== null} onOpenChange={(open) => { if (!open) setModalView(null); }}>
        <DialogContent className="max-w-2xl">
          {modalView === "actions" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  Action Items
                  <span className="text-sm font-normal text-muted-foreground">({actionItems.length})</span>
                </DialogTitle>
              </DialogHeader>
              <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {actionItems.map((item, i) => (
                  <li key={i} className="border-b border-border/50 pb-3 last:border-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{item.owner}</span>
                      {item.priority && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{item.priority}</span>}
                      {item.deadline && <span className="text-xs text-muted-foreground ml-auto">{item.deadline}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{cleanText(item.action)}</p>
                    <Link href={`/meetings/${item.meetingId}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                      <ExternalLink className="h-3 w-3" />{item.topic}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {modalView === "decisions" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-purple-500" />
                  Decisions
                  <span className="text-sm font-normal text-muted-foreground">({decisions.length})</span>
                </DialogTitle>
              </DialogHeader>
              <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {decisions.map((item, i) => (
                  <li key={i} className="border-b border-border/50 pb-3 last:border-0">
                    <p className="text-sm text-muted-foreground">{cleanText(item.decision)}</p>
                    <Link href={`/meetings/${item.meetingId}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                      <ExternalLink className="h-3 w-3" />{item.topic}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {modalView === "clients" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-500" />
                  Client References
                  <span className="text-sm font-normal text-muted-foreground">({clientRefs.length})</span>
                </DialogTitle>
              </DialogHeader>
              <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {clientRefs.map((item, i) => (
                  <li key={i} className="border-b border-border/50 pb-3 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${SENTIMENT_COLORS[item.sentiment] ?? "text-muted-foreground"}`}>{item.clientName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{item.sentiment}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{cleanText(item.context)}</p>
                    <Link href={`/meetings/${item.meetingId}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                      <ExternalLink className="h-3 w-3" />{item.topic}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {/* Summarize with Ask Blarney */}
          <button
            onClick={() => {
              const category = modalView === "actions" ? "action items" : modalView === "decisions" ? "decisions" : "client references";
              setModalView(null);
              const query = encodeURIComponent(`Summarize the key patterns from ${repName}'s internal meetings - focus on ${category}. What needs attention?`);
              router.push(`/search?q=${query}`);
            }}
            className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Summarize with Ask Blarney
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
