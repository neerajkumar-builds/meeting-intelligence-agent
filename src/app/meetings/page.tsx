"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { subDays, subMonths, parseISO } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { MeetingCard } from "@/components/shared/meeting-card";
import { MeetingFilters } from "@/components/meetings/meeting-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetingsList } from "@/lib/hooks/use-meetings-list";
import { CalendarDays } from "lucide-react";
type SortKey = "date" | "score" | "rep" | "company";

export default function MeetingFeedPage() {
  const searchParams = useSearchParams();
  const { data: meetings, isLoading, error } = useMeetingsList({ excludeInternal: false });
  const [repFilter, setRepFilter] = useState(searchParams.get("rep") ?? "all");
  const [stageFilter, setStageFilter] = useState(searchParams.get("stage") ?? "all");
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("company") ?? "");
  const [sortBy, setSortBy] = useState<SortKey>((searchParams.get("sort") as SortKey) ?? "date");
  const [dateRange, setDateRange] = useState(searchParams.get("period") ?? "all");
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") ?? "");

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

    const now = new Date();
    const dateCutoff =
      dateRange === "7d" ? subDays(now, 7) :
      dateRange === "30d" ? subDays(now, 30) :
      dateRange === "90d" ? subMonths(now, 3) : null;

    const result = meetings.filter((m) => {
      if (repFilter !== "all" && m.host_name !== repFilter) return false;
      if (stageFilter === "all") {
        if (m.scoring_stage_type === "internal") return false;
      } else if (m.scoring_stage_type !== stageFilter) {
        return false;
      }
      if (companyFilter && !m.company_name?.toLowerCase().includes(companyFilter.toLowerCase())) return false;
      if (dateCutoff && m.start_time && parseISO(m.start_time) < dateCutoff) return false;
      if (dateFrom && m.start_time && parseISO(m.start_time) < parseISO(dateFrom + "T00:00:00")) return false;
      if (dateTo && m.start_time && parseISO(m.start_time) > parseISO(dateTo + "T23:59:59")) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.overall_score ?? 0) - (a.overall_score ?? 0);
        case "rep":
          return (a.host_name ?? "").localeCompare(b.host_name ?? "");
        case "company":
          return (a.company_name ?? "zzz").localeCompare(b.company_name ?? "zzz");
        case "date":
        default:
          return new Date(b.start_time ?? 0).getTime() - new Date(a.start_time ?? 0).getTime();
      }
    });

    return result;
  }, [meetings, repFilter, stageFilter, companyFilter, sortBy, dateRange, dateFrom, dateTo]);

  const hasActiveFilters = repFilter !== "all" || stageFilter !== "all" || companyFilter !== "" || dateRange !== "all" || dateFrom !== "" || dateTo !== "";

  function clearFilters() {
    setRepFilter("all");
    setStageFilter("all");
    setCompanyFilter("");
    setDateRange("all");
    setDateFrom("");
    setDateTo("");
  }

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
        description={hasActiveFilters ? `Showing ${filtered.length} of ${meetings?.length ?? 0} meetings` : `${filtered.length} meeting${filtered.length !== 1 ? "s" : ""}`}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
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
            sortBy={sortBy}
            onSortChange={(v: string) => setSortBy(v as SortKey)}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            reps={reps}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No meetings match filters"
              description="Try adjusting your filters or clearing the search."
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((meeting, i) => (
                <MeetingCard key={meeting.id} meeting={meeting} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
