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
import { Building2, ArrowRight, Calendar, Hash, Heart, Search } from "lucide-react";

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
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map((company, i) => (
            <Link
              key={company.name}
              href={`/companies/${encodeURIComponent(company.name)}`}
              className="block"
            >
              <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{company.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(company.lastMeeting)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{company.meetingCount}</span>
                      <span className="text-muted-foreground">meetings</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Score</span>
                      <ScoreBadge score={company.avgScore} size="sm" />
                    </div>
                    {company.avgHealth !== null && (
                      <div className="flex items-center gap-1.5">
                        <Heart className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{formatScore(company.avgHealth)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
