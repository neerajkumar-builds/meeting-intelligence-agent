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
  reps,
  hasActiveFilters,
  onClearFilters,
}: MeetingFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <Select value={repFilter} onValueChange={(v) => onRepFilterChange(v ?? "all")}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="All Reps" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Reps</SelectItem>
          {reps.map((rep) => (
            <SelectItem key={rep} value={rep}>
              {rep}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={stageFilter} onValueChange={(v) => onStageFilterChange(v ?? "all")}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="All Stages" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stages</SelectItem>
          {(Object.entries(STAGE_CONFIG) as [ScoringStageType, (typeof STAGE_CONFIG)[ScoringStageType]][]).map(
            ([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>

      <Input
        placeholder="Search company..."
        value={companyFilter}
        onChange={(e) => onCompanyFilterChange(e.target.value)}
        className="w-[180px]"
      />

      <Select value={sortBy} onValueChange={(v) => onSortChange(v ?? "date")}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Sort: Date</SelectItem>
          <SelectItem value="score">Sort: Score</SelectItem>
          <SelectItem value="rep">Sort: Rep</SelectItem>
          <SelectItem value="company">Sort: Company</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="gap-1 text-xs text-muted-foreground"
        >
          <X className="h-3 w-3" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
