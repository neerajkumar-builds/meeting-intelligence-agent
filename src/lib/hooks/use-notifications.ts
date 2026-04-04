"use client";

import { useMemo } from "react";
import { useMeetingsList } from "./use-meetings-list";
import { useSyncStatus } from "./use-sync-status";

export interface Alert {
  id: string;
  type: "at_risk" | "coaching" | "pipeline" | "low_score";
  text: string;
  href: string;
  severity: "red" | "yellow";
}

export function useNotifications() {
  const { data: meetings } = useMeetingsList();
  const { data: syncStatus } = useSyncStatus();

  const alerts = useMemo(() => {
    const result: Alert[] = [];

    if (!meetings) return result;

    // At-risk accounts (health < 5)
    const atRisk = new Map<string, number>();
    for (const m of meetings) {
      if (m.company_name && m.client_health_score !== null && m.client_health_score < 5) {
        if (!atRisk.has(m.company_name)) {
          atRisk.set(m.company_name, m.client_health_score);
        }
      }
    }
    for (const [company, health] of atRisk) {
      result.push({
        id: `risk-${company}`,
        type: "at_risk",
        text: `${company} health at ${health.toFixed(1)} — needs attention`,
        href: `/companies/${encodeURIComponent(company)}`,
        severity: "red",
      });
    }

    // Reps needing coaching (avg < 6.5, min 3 meetings)
    const repAvgs = new Map<string, { total: number; count: number }>();
    for (const m of meetings) {
      if (!m.host_name || m.overall_score === null) continue;
      const entry = repAvgs.get(m.host_name) ?? { total: 0, count: 0 };
      entry.total += m.overall_score;
      entry.count++;
      repAvgs.set(m.host_name, entry);
    }
    for (const [name, { total, count }] of repAvgs) {
      if (count >= 3 && total / count < 6.5) {
        result.push({
          id: `coach-${name}`,
          type: "coaching",
          text: `${name.split(" ")[0]} averaging ${(total / count).toFixed(1)} — coaching focus`,
          href: `/reps/${encodeURIComponent(name)}`,
          severity: "yellow",
        });
      }
    }

    // Pipeline overdue
    if (syncStatus?.status === "stale" || syncStatus?.status === "critical") {
      result.push({
        id: "pipeline-stale",
        type: "pipeline",
        text: syncStatus.status === "critical"
          ? "Pipeline overdue — last sync >24h ago"
          : "Pipeline may need attention — sync overdue",
        href: "/health",
        severity: syncStatus.status === "critical" ? "red" : "yellow",
      });
    }

    // Recent low-scoring meetings (last 5 meetings, score < 5)
    const recent = meetings.slice(0, 10);
    for (const m of recent) {
      if (m.overall_score !== null && m.overall_score < 5 && m.topic) {
        result.push({
          id: `low-${m.id}`,
          type: "low_score",
          text: `"${m.topic}" scored ${m.overall_score.toFixed(1)}`,
          href: `/meetings/${m.id}`,
          severity: "red",
        });
      }
    }

    return result;
  }, [meetings, syncStatus]);

  // Read state from localStorage
  const readAlerts = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("notifications-read") ?? "[]") as string[]
    : [];

  const unreadCount = alerts.filter((a) => !readAlerts.includes(a.id)).length;

  function markAllRead() {
    const ids = alerts.map((a) => a.id);
    localStorage.setItem("notifications-read", JSON.stringify(ids));
  }

  return { alerts, unreadCount, markAllRead };
}
