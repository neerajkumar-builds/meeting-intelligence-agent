"use client";

import { use } from "react";
import Link from "next/link";
import { CompanyHeader } from "@/components/companies/company-header";
import { MeetingTimeline } from "@/components/companies/meeting-timeline";
import { HealthTrendChart } from "@/components/companies/health-trend-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanyMeetings } from "@/lib/hooks/use-company-meetings";
import { ArrowLeft, Building2 } from "lucide-react";

export default function CompanyViewPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const companyName = decodeURIComponent(name);
  const { data: meetings, isLoading, error } = useCompanyMeetings(companyName);

  if (error) {
    return (
      <div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load company data: {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!meetings || meetings.length === 0) {
    return (
      <div>
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to meetings
        </Link>
        <EmptyState
          icon={Building2}
          title={`No meetings with ${companyName}`}
          description="No scored meetings found for this company."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to meetings
      </Link>

      <CompanyHeader companyName={companyName} meetings={meetings} />
      <HealthTrendChart meetings={meetings} />

      <div>
        <h2 className="text-lg font-semibold mb-4">Meeting Timeline</h2>
        <MeetingTimeline meetings={meetings} />
      </div>
    </div>
  );
}
