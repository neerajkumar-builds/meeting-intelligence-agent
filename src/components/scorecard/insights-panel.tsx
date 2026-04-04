"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Sparkles, TrendingDown, TrendingUp, AlertTriangle, ChevronRight, Zap } from "lucide-react";
import { parseISO, subDays, format } from "date-fns";
import type { MeetingsListRow } from "@/types/meetings";

interface InsightsPanelProps {
  meetings: MeetingsListRow[];
}

interface Alert {
  icon: "up" | "down" | "warning";
  text: string;
  type: "positive" | "negative" | "neutral";
  href?: string;
}

const ALERT_ICONS = { up: TrendingUp, down: TrendingDown, warning: AlertTriangle };
const ALERT_STYLES = {
  positive: "border-emerald-200/50 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300",
  negative: "border-red-200/50 bg-red-50/50 text-red-800 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300",
  neutral: "border-border/50 bg-muted/30 text-foreground",
};

export function InsightsPanel({ meetings }: InsightsPanelProps) {
  const { briefing, alerts } = useMemo(() => generateBriefingAndAlerts(meetings), [meetings]);

  if (!briefing && alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Weekly Briefing — narrative summary */}
      {briefing && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[#146DFA] to-[#146DFA]/60 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold">Weekly Briefing</h3>
            <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(), "MMM d, yyyy")}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{briefing}</p>
          <Link href="/search" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
            Ask Blarney for more <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Smart Alerts — horizontal scrollable strip */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">Alerts</span>
          </div>
          {alerts.map((alert, i) => {
            const Icon = ALERT_ICONS[alert.icon];
            const content = (
              <div
                className={`flex items-center gap-2 shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap ${ALERT_STYLES[alert.type]}`}
              >
                <Icon className="h-3 w-3 shrink-0" />
                <span>{alert.text}</span>
              </div>
            );
            return alert.href ? (
              <Link key={i} href={alert.href} className="shrink-0 hover:opacity-80 transition-opacity">
                {content}
              </Link>
            ) : (
              <div key={i} className="shrink-0">{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function generateBriefingAndAlerts(meetings: MeetingsListRow[]): { briefing: string | null; alerts: Alert[] } {
  const alerts: Alert[] = [];
  if (meetings.length < 3) return { briefing: null, alerts };

  const now = new Date();
  const oneWeekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);

  // --- Compute stats ---
  const scored = meetings.filter((m) => m.overall_score !== null);
  const avgScore = scored.length > 0 ? scored.reduce((s, m) => s + m.overall_score!, 0) / scored.length : 0;

  const thisWeek = scored.filter((m) => m.start_time && parseISO(m.start_time) >= oneWeekAgo);
  const lastWeek = scored.filter((m) => m.start_time && parseISO(m.start_time) >= twoWeeksAgo && parseISO(m.start_time) < oneWeekAgo);
  const thisWeekAvg = thisWeek.length > 0 ? thisWeek.reduce((s, m) => s + m.overall_score!, 0) / thisWeek.length : null;
  const lastWeekAvg = lastWeek.length > 0 ? lastWeek.reduce((s, m) => s + m.overall_score!, 0) / lastWeek.length : null;
  const scoreDelta = thisWeekAvg !== null && lastWeekAvg !== null ? thisWeekAvg - lastWeekAvg : null;

  // Rep stats
  const repStats = new Map<string, { scores: number[]; thisWeek: number[]; lastWeek: number[] }>();
  for (const m of meetings) {
    if (!m.host_name || m.overall_score === null) continue;
    const entry = repStats.get(m.host_name) ?? { scores: [], thisWeek: [], lastWeek: [] };
    entry.scores.push(m.overall_score);
    if (m.start_time) {
      const d = parseISO(m.start_time);
      if (d >= oneWeekAgo) entry.thisWeek.push(m.overall_score);
      else if (d >= twoWeeksAgo) entry.lastWeek.push(m.overall_score);
    }
    repStats.set(m.host_name, entry);
  }

  // Top performer + biggest mover
  let topRep = { name: "", avg: 0, count: 0 };
  let biggestDrop = { name: "", delta: 0 };
  let biggestRise = { name: "", delta: 0 };
  for (const [name, stats] of repStats) {
    if (stats.scores.length < 3) continue;
    const avg = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
    if (avg > topRep.avg) topRep = { name, avg, count: stats.scores.length };

    if (stats.thisWeek.length >= 2 && stats.lastWeek.length >= 2) {
      const twAvg = stats.thisWeek.reduce((a, b) => a + b, 0) / stats.thisWeek.length;
      const lwAvg = stats.lastWeek.reduce((a, b) => a + b, 0) / stats.lastWeek.length;
      const d = twAvg - lwAvg;
      if (d < biggestDrop.delta) biggestDrop = { name, delta: d };
      if (d > biggestRise.delta) biggestRise = { name, delta: d };
    }
  }

  // At-risk accounts
  const atRisk: string[] = [];
  const companyHealth = new Map<string, number>();
  for (const m of [...meetings].sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""))) {
    if (m.company_name && m.client_health_score !== null) {
      companyHealth.set(m.company_name, m.client_health_score);
    }
  }
  for (const [company, health] of companyHealth) {
    if (health < 5) atRisk.push(company);
  }

  // --- Build briefing narrative ---
  const parts: string[] = [];

  // Trend sentence
  if (scoreDelta !== null) {
    const direction = scoreDelta >= 0 ? "up" : "down";
    parts.push(`Team score is trending ${direction} (${scoreDelta >= 0 ? "+" : ""}${scoreDelta.toFixed(1)} vs last week) at ${avgScore.toFixed(1)} average.`);
  } else {
    parts.push(`Team averaging ${avgScore.toFixed(1)} across ${scored.length} scored meetings.`);
  }

  // Top performer
  if (topRep.name) {
    parts.push(`${topRep.name.split(" ")[0]} leads at ${topRep.avg.toFixed(1)} across ${topRep.count} meetings.`);
  }

  // Risk
  if (atRisk.length > 0) {
    parts.push(`Watch ${atRisk.join(" and ")} - health below 5.0.`);
  }

  // Biggest mover
  if (biggestDrop.delta <= -1) {
    parts.push(`${biggestDrop.name.split(" ")[0]} dropped ${Math.abs(biggestDrop.delta).toFixed(1)} pts this week - review latest calls.`);
  }

  const briefing = parts.length > 0 ? parts.join(" ") : null;

  // --- Build alerts (change-over-time, not static) ---

  // Rep score drops
  for (const [name, stats] of repStats) {
    if (stats.thisWeek.length >= 2 && stats.lastWeek.length >= 2) {
      const twAvg = stats.thisWeek.reduce((a, b) => a + b, 0) / stats.thisWeek.length;
      const lwAvg = stats.lastWeek.reduce((a, b) => a + b, 0) / stats.lastWeek.length;
      if (twAvg - lwAvg <= -1) {
        alerts.push({
          icon: "down",
          text: `${name.split(" ")[0]} ↓${Math.abs(twAvg - lwAvg).toFixed(1)} this week`,
          type: "negative",
          href: `/reps/${encodeURIComponent(name)}`,
        });
      } else if (twAvg - lwAvg >= 1) {
        alerts.push({
          icon: "up",
          text: `${name.split(" ")[0]} ↑${(twAvg - lwAvg).toFixed(1)} this week`,
          type: "positive",
          href: `/reps/${encodeURIComponent(name)}`,
        });
      }
    }
  }

  // At-risk accounts
  for (const company of atRisk) {
    alerts.push({
      icon: "warning",
      text: `${company} health < 5`,
      type: "negative",
      href: `/companies/${encodeURIComponent(company)}`,
    });
  }

  // New meetings this week
  if (thisWeek.length > 0) {
    alerts.push({
      icon: "up",
      text: `${thisWeek.length} new meetings this week`,
      type: "neutral",
      href: "/meetings",
    });
  }

  return { briefing, alerts };
}
