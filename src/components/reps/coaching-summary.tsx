"use client";

import { useState } from "react";
import { useRepCoaching } from "@/lib/hooks/use-rep-coaching";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Target, AlertTriangle, Eye, Lightbulb, TrendingUp, ChevronDown } from "lucide-react";

interface CoachingSummaryProps {
  repName: string;
}

const SECTIONS = [
  { key: "strengths" as const, label: "Strengths", icon: Target, accent: "border-l-emerald-500", iconColor: "text-emerald-500", bg: "bg-emerald-500/5" },
  { key: "improvements" as const, label: "Areas for Improvement", icon: AlertTriangle, accent: "border-l-amber-500", iconColor: "text-amber-500", bg: "bg-amber-500/5" },
  { key: "blindSpots" as const, label: "Blind Spots", icon: Eye, accent: "border-l-red-500", iconColor: "text-red-500", bg: "bg-red-500/5" },
  { key: "recommendations" as const, label: "Coaching Recommendations", icon: Lightbulb, accent: "border-l-blue-500", iconColor: "text-blue-500", bg: "bg-blue-500/5" },
  { key: "dealProgressions" as const, label: "Deal Progression", icon: TrendingUp, accent: "border-l-purple-500", iconColor: "text-purple-500", bg: "bg-purple-500/5" },
] as const;

// Primary categories shown by default, rest behind expand
const PRIMARY_KEYS = new Set(["strengths", "improvements"]);

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "...";
}

export function CoachingSummary({ repName }: CoachingSummaryProps) {
  const { data: coaching, isLoading, error } = useRepCoaching(repName);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
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
          // Collapsed: 1 insight, truncated. Expanded: up to 3, longer.
          const display = expanded ? items.slice(0, 3) : items.slice(0, 1);
          const charLimit = expanded ? 180 : 120;

          return (
            <Card key={section.key} className={`border-l-4 ${section.accent} overflow-hidden`}>
              <CardContent className={`px-4 py-3 ${section.bg}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`h-3.5 w-3.5 ${section.iconColor}`} />
                  <p className="text-xs font-semibold">{section.label}</p>
                  <span className="text-[10px] text-muted-foreground ml-auto">{items.length} insights</span>
                </div>
                <ul className="space-y-1">
                  {display.map((text, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                      {truncate(text, charLimit)}
                    </li>
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
