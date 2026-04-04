"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STAGE_CONFIG, type ScoringStageType } from "@/lib/constants";
import { X, Search, SlidersHorizontal } from "lucide-react";

interface MeetingFiltersProps {
  repFilter: string;
  onRepFilterChange: (value: string) => void;
  companyFilter: string;
  onCompanyFilterChange: (value: string) => void;
  stageFilter: string;
  onStageFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  dateFrom?: string;
  onDateFromChange?: (value: string) => void;
  dateTo?: string;
  onDateToChange?: (value: string) => void;
  reps: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function MeetingFilters({
  repFilter,
  onRepFilterChange,
  companyFilter,
  onCompanyFilterChange,
  stageFilter,
  onStageFilterChange,
  sortBy,
  onSortChange,
  dateRange,
  onDateRangeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  reps,
  hasActiveFilters,
  onClearFilters,
}: MeetingFiltersProps) {
  // When Period preset is selected, clear custom dates
  function handlePeriodChange(v: string) {
    onDateRangeChange(v ?? "all");
    if (v !== "all" && v !== "custom") {
      onDateFromChange?.("");
      onDateToChange?.("");
    }
  }

  // When custom date is set, switch period to "all" (disable preset)
  function handleDateFromChange(v: string) {
    onDateFromChange?.(v);
    if (v) onDateRangeChange("all");
  }

  function handleDateToChange(v: string) {
    onDateToChange?.(v);
    if (v) onDateRangeChange("all");
  }

  return (
    <div className="rounded-lg border bg-card/50 p-3 mb-4">
      <div className="flex items-center gap-1.5 mb-2.5">
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Filters</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="gap-1 text-xs text-muted-foreground h-6 px-2 ml-auto"
          >
            <X className="h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Rep</label>
          <Select value={repFilter} onValueChange={(v) => onRepFilterChange(v ?? "all")}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="All Reps" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reps</SelectItem>
              {reps.map((rep) => (
                <SelectItem key={rep} value={rep}>{rep}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Stage</label>
          <Select value={stageFilter} onValueChange={(v) => onStageFilterChange(v ?? "all")}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {(Object.entries(STAGE_CONFIG) as [ScoringStageType, (typeof STAGE_CONFIG)[ScoringStageType]][]).map(
                ([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Period</label>
          <Select value={dateRange} onValueChange={(v) => handlePeriodChange(v ?? "all")}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {onDateFromChange && onDateToChange && (
          <>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">From</label>
              <Input
                type="date"
                value={dateFrom ?? ""}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="w-[135px] h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">To</label>
              <Input
                type="date"
                value={dateTo ?? ""}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="w-[135px] h-8 text-xs"
              />
            </div>
          </>
        )}

        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Sort</label>
          <Select value={sortBy} onValueChange={(v) => onSortChange(v ?? "date")}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="score">Score</SelectItem>
              <SelectItem value="rep">Rep</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="max-w-[180px]">
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Company</label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={companyFilter}
              onChange={(e) => onCompanyFilterChange(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
