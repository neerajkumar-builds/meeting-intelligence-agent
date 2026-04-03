"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ScoreBadge } from "@/components/shared/score-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMeetingsList } from "@/lib/hooks/use-meetings-list";
import { formatDate, formatScore } from "@/lib/utils/format";
import { Building2 } from "lucide-react";

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
      if (
        !existing.lastMeeting ||
        (m.start_time && m.start_time > existing.lastMeeting)
      ) {
        existing.lastMeeting = m.start_time;
      }

      map.set(m.company_name, existing);
    }

    // Calculate averages
    for (const [name, stats] of map) {
      const companyMeetings = meetings.filter(
        (m) => m.company_name === name
      );
      const scored = companyMeetings.filter(
        (m) => m.overall_score !== null
      );
      stats.avgScore =
        scored.length > 0
          ? scored.reduce((s, m) => s + m.overall_score!, 0) / scored.length
          : null;

      const withHealth = companyMeetings.filter(
        (m) => m.client_health_score !== null
      );
      stats.avgHealth =
        withHealth.length > 0
          ? withHealth.reduce((s, m) => s + m.client_health_score!, 0) /
            withHealth.length
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
          <p className="text-sm text-destructive">
            Failed to load data: {(error as Error).message}
          </p>
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
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No company data"
          description="Company data will appear once meetings are scored with HubSpot company information."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead className="text-center">Meetings</TableHead>
                <TableHead className="text-center">Avg Score</TableHead>
                <TableHead className="text-center">Health</TableHead>
                <TableHead>Last Meeting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.name}>
                  <TableCell>
                    <Link
                      href={`/companies/${encodeURIComponent(company.name)}`}
                      className="font-medium hover:underline"
                    >
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    {company.meetingCount}
                  </TableCell>
                  <TableCell className="text-center">
                    <ScoreBadge score={company.avgScore} />
                  </TableCell>
                  <TableCell className="text-center">
                    {company.avgHealth !== null
                      ? formatScore(company.avgHealth)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(company.lastMeeting)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
