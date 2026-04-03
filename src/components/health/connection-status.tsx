"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

interface ServiceStatus {
  name: string;
  status: "green" | "yellow" | "red" | "checking";
  detail: string;
}

const DOT_COLORS = {
  green: "bg-emerald-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  checking: "bg-gray-400 animate-pulse",
};

const BG_COLORS = {
  green: "border-emerald-200 dark:border-emerald-800",
  yellow: "border-yellow-200 dark:border-yellow-800",
  red: "border-red-200 dark:border-red-800",
  checking: "border-border",
};

export function ConnectionStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Supabase", status: "checking", detail: "Checking..." },
    { name: "Scoring Pipeline", status: "checking", detail: "Checking..." },
    { name: "RAG Search", status: "checking", detail: "Checking..." },
  ]);

  useEffect(() => {
    checkServices();
  }, []);

  async function checkServices() {
    const results: ServiceStatus[] = [];

    // Check Supabase
    try {
      const { data, error } = await supabase
        .from("scoring_run_log")
        .select("id")
        .limit(1);
      results.push({
        name: "Supabase",
        status: error ? "red" : "green",
        detail: error ? error.message : "Connected",
      });
    } catch {
      results.push({ name: "Supabase", status: "red", detail: "Unreachable" });
    }

    // Check scoring pipeline recency
    try {
      const { data: logs } = await supabase
        .from("scoring_run_log")
        .select("run_started_at")
        .order("run_started_at", { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        const lastRun = new Date(logs[0].run_started_at);
        const hoursAgo = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
        if (hoursAgo < 24) {
          results.push({
            name: "Scoring Pipeline",
            status: "green",
            detail: `Last run ${Math.round(hoursAgo)}h ago`,
          });
        } else if (hoursAgo < 48) {
          results.push({
            name: "Scoring Pipeline",
            status: "yellow",
            detail: `Last run ${Math.round(hoursAgo)}h ago`,
          });
        } else {
          results.push({
            name: "Scoring Pipeline",
            status: "red",
            detail: `Last run ${Math.round(hoursAgo)}h ago`,
          });
        }
      } else {
        results.push({
          name: "Scoring Pipeline",
          status: "red",
          detail: "No runs found",
        });
      }
    } catch {
      results.push({
        name: "Scoring Pipeline",
        status: "red",
        detail: "Check failed",
      });
    }

    // Check RAG readiness
    try {
      const { count } = await supabase
        .from("meeting_chunks")
        .select("id", { count: "exact", head: true });
      results.push({
        name: "RAG Search",
        status: count && count > 0 ? "green" : "yellow",
        detail: count ? `${count} chunks indexed` : "No chunks",
      });
    } catch {
      results.push({ name: "RAG Search", status: "red", detail: "Check failed" });
    }

    setServices(results);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {services.map((svc) => (
        <Card key={svc.name} className={`${BG_COLORS[svc.status]}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${DOT_COLORS[svc.status]}`} />
            <div>
              <p className="text-sm font-medium">{svc.name}</p>
              <p className="text-xs text-muted-foreground">{svc.detail}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
