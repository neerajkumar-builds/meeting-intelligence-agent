"use client";

import { useMemo } from "react";
import { Lightbulb, TrendingDown, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import type { MeetingsListRow } from "@/types/meetings";

interface InsightsPanelProps {
  meetings: MeetingsListRow[];
}

interface Insight {
  icon: "up" | "down" | "warning" | "chart";
  text: string;
  type: "positive" | "negative" | "neutral";
}

const ICON_MAP = {
  up: TrendingUp,
  down: TrendingDown,
  warning: AlertTriangle,
  chart: BarChart3,
};

const TYPE_STYLES = {
  positive: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
  negative: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
  neutral: "border-border bg-muted/50",
};

const ICON_STYLES = {
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
};

export function InsightsPanel({ meetings }: InsightsPanelProps) {
  const insights = useMemo(() => generateInsights(meetings), [meetings]);

  if (insights.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-[#146DFA]" />
        <h3 className="text-sm font-semibold">Cross-Call Insights</h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {insights.slice(0, 6).map((insight, i) => {
          const Icon = ICON_MAP[insight.icon];
          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 rounded-md border p-3 text-sm ${TYPE_STYLES[insight.type]}`}
            >
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${ICON_STYLES[insight.type]}`} />
              <span className="leading-snug">{insight.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function generateInsights(meetings: MeetingsListRow[]): Insight[] {
  const insights: Insight[] = [];
  if (meetings.length < 3) return insights;

  // --- Rep performance patterns ---
  const repStats = new Map<string, { scores: number[]; stages: Map<string, number[]> }>();
  for (const m of meetings) {
    if (!m.host_name || m.overall_score === null) continue;
    const entry = repStats.get(m.host_name) ?? { scores: [], stages: new Map() };
    entry.scores.push(m.overall_score);
    if (m.scoring_stage_type) {
      const stageScores = entry.stages.get(m.scoring_stage_type) ?? [];
      stageScores.push(m.overall_score);
      entry.stages.set(m.scoring_stage_type, stageScores);
    }
    repStats.set(m.host_name, entry);
  }

  // Find rep with biggest stage gap
  for (const [name, stats] of repStats) {
    if (stats.stages.size < 2) continue;
    let highest = { stage: "", avg: 0 };
    let lowest = { stage: "", avg: 10 };
    for (const [stage, scores] of stats.stages) {
      if (scores.length < 2) continue;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > highest.avg) highest = { stage, avg };
      if (avg < lowest.avg) lowest = { stage, avg };
    }
    if (highest.stage && lowest.stage && highest.avg - lowest.avg >= 1.5) {
      const firstName = name.split(" ")[0];
      const stageLabel = (s: string) =>
        s === "discovery_scoping" ? "discovery" : s === "follow_up" ? "follow-up" : s;
      insights.push({
        icon: "chart",
        text: `${firstName} averages ${highest.avg.toFixed(1)} on ${stageLabel(highest.stage)} but ${lowest.avg.toFixed(1)} on ${stageLabel(lowest.stage)}`,
        type: "neutral",
      });
    }
  }

  // --- Stage distribution ---
  const stageCounts = new Map<string, number>();
  for (const m of meetings) {
    if (!m.scoring_stage_type) continue;
    stageCounts.set(m.scoring_stage_type, (stageCounts.get(m.scoring_stage_type) ?? 0) + 1);
  }
  const internalCount = stageCounts.get("internal") ?? 0;
  if (internalCount > meetings.length * 0.4) {
    insights.push({
      icon: "chart",
      text: `${internalCount} of ${meetings.length} meetings are internal (${Math.round((internalCount / meetings.length) * 100)}%) — high internal meeting volume`,
      type: "neutral",
    });
  }

  // --- Stage score comparison ---
  const stageAvgs = new Map<string, number>();
  for (const [stage, count] of stageCounts) {
    const staged = meetings.filter(
      (m) => m.scoring_stage_type === stage && m.overall_score !== null
    );
    if (staged.length >= 2) {
      stageAvgs.set(
        stage,
        staged.reduce((s, m) => s + m.overall_score!, 0) / staged.length
      );
    }
  }
  let weakestStage = { stage: "", avg: 10 };
  for (const [stage, avg] of stageAvgs) {
    if (avg < weakestStage.avg) weakestStage = { stage, avg };
  }
  if (weakestStage.stage && weakestStage.avg < 7) {
    const label =
      weakestStage.stage === "discovery_scoping" ? "Discovery" :
      weakestStage.stage === "follow_up" ? "Follow-up" :
      weakestStage.stage === "onboarding" ? "Onboarding" : "Internal";
    insights.push({
      icon: "down",
      text: `${label} meetings score lowest at ${weakestStage.avg.toFixed(1)} avg — potential coaching focus area`,
      type: "negative",
    });
  }

  // --- Account health trends ---
  const companyHealth = new Map<string, { scores: number[]; latest: number }>();
  const sorted = [...meetings].sort(
    (a, b) => new Date(a.start_time ?? 0).getTime() - new Date(b.start_time ?? 0).getTime()
  );
  for (const m of sorted) {
    if (!m.company_name || m.client_health_score === null) continue;
    const entry = companyHealth.get(m.company_name) ?? { scores: [], latest: 0 };
    entry.scores.push(m.client_health_score);
    entry.latest = m.client_health_score;
    companyHealth.set(m.company_name, entry);
  }
  for (const [company, data] of companyHealth) {
    if (data.scores.length < 2) continue;
    const first = data.scores[0];
    const last = data.scores[data.scores.length - 1];
    if (last - first <= -2) {
      insights.push({
        icon: "down",
        text: `${company} health dropped from ${first} to ${last} — review needed`,
        type: "negative",
      });
    } else if (last - first >= 2) {
      insights.push({
        icon: "up",
        text: `${company} health improved from ${first} to ${last} — strong trajectory`,
        type: "positive",
      });
    }
  }

  // --- Single-meeting companies ---
  const companyCounts = new Map<string, number>();
  for (const m of meetings) {
    if (!m.company_name) continue;
    companyCounts.set(m.company_name, (companyCounts.get(m.company_name) ?? 0) + 1);
  }
  const singleMeetingCompanies = [...companyCounts.entries()].filter(
    ([, count]) => count === 1
  );
  if (singleMeetingCompanies.length >= 3) {
    insights.push({
      icon: "warning",
      text: `${singleMeetingCompanies.length} companies have only 1 scored meeting — potential relationship coverage gaps`,
      type: "negative",
    });
  }

  // --- Top performer ---
  let topRep = { name: "", avg: 0, count: 0 };
  for (const [name, stats] of repStats) {
    if (stats.scores.length < 3) continue;
    const avg = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
    if (avg > topRep.avg) topRep = { name, avg, count: stats.scores.length };
  }
  if (topRep.name) {
    insights.push({
      icon: "up",
      text: `${topRep.name.split(" ")[0]} leads with ${topRep.avg.toFixed(1)} avg across ${topRep.count} meetings`,
      type: "positive",
    });
  }

  return insights;
}
