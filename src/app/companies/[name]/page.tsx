"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CompanyHeader } from "@/components/companies/company-header";
import { MeetingTimeline } from "@/components/companies/meeting-timeline";
import { HealthTrendChart } from "@/components/companies/health-trend-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanyMeetings } from "@/lib/hooks/use-company-meetings";
import { IntelligenceSidebar } from "@/components/companies/intelligence-sidebar";
import { ArrowLeft, Building2, Sparkles, Target, Swords } from "lucide-react";

export default function CompanyViewPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const companyName = decodeURIComponent(name);
  const { data: meetings, isLoading, error } = useCompanyMeetings(companyName);
  const router = useRouter();

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
          href="/companies"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to companies
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
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        <Link
          href="/companies"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to companies
        </Link>

        <CompanyHeader companyName={companyName} meetings={meetings} />

        {/* Quick AI actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const q = encodeURIComponent(`Give me a MEDDIC analysis for ${companyName} based on all meeting data. For each element (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion), cite specific evidence from meetings or note where data is missing.`);
              router.push(`/search?q=${q}`);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Target className="h-3.5 w-3.5" />
            MEDDIC Analysis
          </button>
          <button
            onClick={() => {
              const q = encodeURIComponent(`Summarize the full relationship history with ${companyName}. Include deal status, key stakeholders, account health trend, and recommended next steps.`);
              router.push(`/search?q=${q}`);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Account Intelligence
          </button>
          <button
            onClick={() => {
              const q = encodeURIComponent(`Were any competitors mentioned in meetings with ${companyName}? If so, which competitors, in what context, and what was the sentiment?`);
              router.push(`/search?q=${q}`);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Swords className="h-3.5 w-3.5" />
            Competitor Intel
          </button>
        </div>

        <HealthTrendChart meetings={meetings} />

        <div>
          <h2 className="text-lg font-semibold mb-4">Meeting Timeline</h2>
          <MeetingTimeline meetings={meetings} />
        </div>
      </div>

      {/* Intelligence Sidebar */}
      <IntelligenceSidebar companyName={companyName} />
    </div>
  );
}
