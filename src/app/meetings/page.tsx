"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { MeetingCard } from "@/components/shared/meeting-card";
import { MeetingFilters } from "@/components/meetings/meeting-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetingsList } from "@/lib/hooks/use-meetings-list";
import { CalendarDays } from "lucide-react";

export default function MeetingFeedPage() {
  const { data: meetings, isLoading, error } = useMeetingsList();
  const [repFilter, setRepFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");

  const reps = useMemo(() => {
    if (!meetings) return [];
    const names = new Set<string>();
    for (const m of meetings) {
      if (m.host_name) names.add(m.host_name);
    }
    return Array.from(names).sort();
  }, [meetings]);

  const filtered = useMemo(() => {
    if (!meetings) return [];
    return meetings.filter((m) => {
      if (repFilter !== "all" && m.host_name !== repFilter) return false;
      if (stageFilter !== "all" && m.scoring_stage_type !== stageFilter)
        return false;
      if (
        companyFilter &&
        !m.company_name?.toLowerCase().includes(companyFilter.toLowerCase())
      )
        return false;
      return true;
    });
  }, [meetings, repFilter, stageFilter, companyFilter]);

  if (error) {
    return (
      <div>
        <PageHeader title="Meeting Feed" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load meetings: {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Meeting Feed"
        description={`${filtered.length} meeting${filtered.length !== 1 ? "s" : ""}`}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <MeetingFilters
            repFilter={repFilter}
            onRepFilterChange={setRepFilter}
            companyFilter={companyFilter}
            onCompanyFilterChange={setCompanyFilter}
            stageFilter={stageFilter}
            onStageFilterChange={setStageFilter}
            reps={reps}
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No meetings match filters"
              description="Try adjusting your filters or clearing the search."
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
