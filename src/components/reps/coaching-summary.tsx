"use client";

import { useState } from "react";
import Link from "next/link";
import { useRepCoaching, type CoachingInsight } from "@/lib/hooks/use-rep-coaching";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Target, AlertTriangle, Eye, Lightbulb, TrendingUp, ChevronDown, ExternalLink } from "lucide-react";

interface CoachingSummaryProps {
  repName: string;
}

const SECTIONS = [
  { key: "strengths" as const, label: "Strengths", icon: Target, accent: "border-l-emerald-500", iconColor: "text-emerald-500", bg: "bg-emerald-500/5" },
  { key: "improvements" as const, label: "Areas for Improvement", icon: AlertTriangle, accent: "border-l-amber-500", iconColor: "text-amber-500", bg: "bg-amber-500/5" },
  { key: "blindSpots" as const, label: "Blind Spots", icon: Eye, accent: "border-l-red-500", iconColor: "text-red-500", bg: "bg-red-500/5" },
  { key: "recommendations" as const, label: "Coaching Tips", icon: Lightbulb, accent: "border-l-blue-500", iconColor: "text-blue-500", bg: "bg-blue-500/5" },
  { key: "dealProgressions" as const, label: "Deal Progression", icon: TrendingUp, accent: "border-l-purple-500", iconColor: "text-purple-500", bg: "bg-purple-500/5" },
] as const;

const PRIMARY_KEYS = new Set(["strengths", "improvements"]);

/** Replace em dashes with spaced hyphens - display only */
function cleanText(text: string): string {
  return text.replace(/\u2014/g, " - ").replace(/—/g, " - ");
}

/** Extract first sentence (up to first period/!/? after 40 chars, max 150 chars) */
function firstSentence(text: string): string {
  const clean = cleanText(text);
  const match = clean.match(/^.{40,}?[.!?]/);
  if (match && match[0].length <= 150) return match[0];
  if (clean.length <= 150) return clean;
  return clean.slice(0, 150).replace(/\s+\S*$/, "") + "...";
}

function InsightRow({ insight }: { insight: CoachingInsight }) {
  return (
    <li className="text-xs leading-relaxed">
      <span className="text-muted-foreground">{firstSentence(cleanText(insight.text))}</span>
      <Link
        href={`/meetings/${insight.meetingId}`}
        className="inline-flex items-center gap-0.5 text-primary hover:underline ml-1 whitespace-nowrap"
      >
        <ExternalLink className="h-2.5 w-2.5" />
        <span className="max-w-[120px] truncate">{insight.topic}</span>
      </Link>
    </li>
  );
}

export function CoachingSummary({ repName }: CoachingSummaryProps) {
  const { data: coaching, isLoading, error } = useRepCoaching(repName);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  if (error || !coaching) return null;

  const activeSections = SECTIONS.filter((s) => coaching[s.key].length > 0);
  if (activeSections.length === 0) return null;

  const primarySections = activeSections.filter((s) => PRIMARY_KEYS.has(s.key));
  const secondarySections = activeSections.filter((s) => !PRIMARY_KEYS.has(s.key));
  const visibleSections = expanded ? activeSections : primarySections;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Coaching Insights <span className="normal-case tracking-normal opacity-60">· {coaching.meetingsAnalyzed} meetings analyzed</span>
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
        {visibleSections.map((section) => {
          const Icon = section.icon;
          const items = coaching[section.key];
          const display = items.slice(0, expanded ? 3 : 2);

          return (
            <Card key={section.key} className={`border-l-4 ${section.accent} overflow-hidden`}>
              <CardContent className={`px-4 py-3 ${section.bg}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`h-3.5 w-3.5 ${section.iconColor}`} />
                  <p className="text-xs font-semibold">{section.label}</p>
                  <span className="text-[10px] text-muted-foreground ml-auto">{items.length}</span>
                </div>
                <ul className="space-y-1.5">
                  {display.map((insight, i) => (
                    <InsightRow key={i} insight={insight} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {secondarySections.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded
            ? "Show less"
            : `Show ${secondarySections.length} more (${secondarySections.map(s => s.label).join(", ")})`
          }
        </button>
      )}
    </div>
  );
}
