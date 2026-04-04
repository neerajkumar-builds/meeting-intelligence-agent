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
import { X } from "lucide-react";

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
  reps,
  hasActiveFilters,
  onClearFilters,
}: MeetingFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 mb-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Rep</label>
        <Select value={repFilter} onValueChange={(v) => onRepFilterChange(v ?? "all")}>
          <SelectTrigger className="w-[170px]">
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
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Stage</label>
        <Select value={stageFilter} onValueChange={(v) => onStageFilterChange(v ?? "all")}>
          <SelectTrigger className="w-[170px]">
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
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Company</label>
        <Input
          placeholder="Search company..."
          value={companyFilter}
          onChange={(e) => onCompanyFilterChange(e.target.value)}
          className="w-[180px]"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Period</label>
        <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sort by</label>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v ?? "date")}>
          <SelectTrigger className="w-[150px]">
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

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="gap-1 text-xs text-muted-foreground mb-0.5"
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
