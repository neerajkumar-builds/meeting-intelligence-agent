"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ScoreBadge } from "@/components/shared/score-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useMeetingsList } from "@/lib/hooks/use-meetings-list";
import { formatDate, formatScore } from "@/lib/utils/format";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Heart, Search, SlidersHorizontal } from "lucide-react";

interface CompanyStats {
  name: string;
  meetingCount: number;
  avgScore: number | null;
  avgHealth: number | null;
  lastMeeting: string | null;
  stages: Set<string>;
}

export default function CompaniesIndexPage() {
  const { data: meetings, isLoading, error } = useMeetingsList();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "az" | "za" | "score" | "health" | "meetings">("recent");

  const companies = useMemo(() => {
    if (!meetings) return [];

    const map = new Map<string, CompanyStats>();
    for (const m of meetings) {
      if (!m.company_name) continue;
      const existing = map.get(m.company_name) ?? {
        name: m.company_name,
        meetingCount: 0,
        avgScore: null,
        avgHealth: null,
        lastMeeting: null,
        stages: new Set<string>(),
      };
      existing.meetingCount++;
      if (m.scoring_stage_type) existing.stages.add(m.scoring_stage_type);
      if (!existing.lastMeeting || (m.start_time && m.start_time > existing.lastMeeting)) {
        existing.lastMeeting = m.start_time;
      }
      map.set(m.company_name, existing);
    }

    for (const [name, stats] of map) {
      const companyMeetings = meetings.filter((m) => m.company_name === name);
      const scored = companyMeetings.filter((m) => m.overall_score !== null);
      stats.avgScore =
        scored.length > 0
          ? scored.reduce((s, m) => s + m.overall_score!, 0) / scored.length
          : null;
      const withHealth = companyMeetings.filter((m) => m.client_health_score !== null);
      stats.avgHealth =
        withHealth.length > 0
          ? withHealth.reduce((s, m) => s + m.client_health_score!, 0) / withHealth.length
          : null;
    }

    return Array.from(map.values()).sort(
      (a, b) => (b.lastMeeting ?? "").localeCompare(a.lastMeeting ?? "")
    );
  }, [meetings]);

  if (error) {
    return (
      <div>
        <PageHeader title="Companies" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Failed to load data: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Companies"
        description={`${companies.length} companies with scored meetings`}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No company data"
          description="Company data will appear once meetings are scored with HubSpot company information."
        />
      ) : (
        <>
        {/* Filters */}
        <div className="rounded-lg border bg-card/50 p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Filters</span>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="ml-auto text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
              >
                <span className="h-3 w-3 flex items-center justify-center">&times;</span>
                Clear
              </button>
            )}
          </div>
          <div className="flex items-end gap-2">
            <div className="max-w-[220px] flex-1">
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Company name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Sort by</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="az">A → Z</SelectItem>
                  <SelectItem value="za">Z → A</SelectItem>
                  <SelectItem value="meetings">Most Meetings</SelectItem>
                  <SelectItem value="score">Avg Score</SelectItem>
                  <SelectItem value="health">Health Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {companies
            .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => {
              switch (sortBy) {
                case "az": return a.name.localeCompare(b.name);
                case "za": return b.name.localeCompare(a.name);
                case "meetings": return b.meetingCount - a.meetingCount;
                case "score": return (b.avgScore ?? 0) - (a.avgScore ?? 0);
                case "health": return (b.avgHealth ?? 0) - (a.avgHealth ?? 0);
                default: return (b.lastMeeting ?? "").localeCompare(a.lastMeeting ?? "");
              }
            })
            .map((company) => {
              const healthColor = company.avgHealth !== null
                ? company.avgHealth >= 7 ? "border-l-emerald-500"
                : company.avgHealth >= 5 ? "border-l-yellow-500"
                : "border-l-red-500"
                : "border-l-gray-200 dark:border-l-gray-700";
              return (
                <Link
                  key={company.name}
                  href={`/companies/${encodeURIComponent(company.name)}`}
                  className="block"
                >
                  <Card className={`h-full border-l-4 ${healthColor} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30`}>
                    <CardContent className="px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm truncate">{company.name}</h3>
                        <ScoreBadge score={company.avgScore} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{company.meetingCount} {company.meetingCount === 1 ? "meeting" : "meetings"}</span>
                        <span>{formatDate(company.lastMeeting)}</span>
                        {company.avgHealth !== null && (
                          <span className="flex items-center gap-1">
                            <Heart className="h-2.5 w-2.5" />
                            {formatScore(company.avgHealth)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
        </div>
        </>
      )}
    </div>
  );
}
