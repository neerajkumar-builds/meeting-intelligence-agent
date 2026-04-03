"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STAGE_CONFIG, type ScoringStageType } from "@/lib/constants";

interface MeetingFiltersProps {
  repFilter: string;
  onRepFilterChange: (value: string) => void;
  companyFilter: string;
  onCompanyFilterChange: (value: string) => void;
  stageFilter: string;
  onStageFilterChange: (value: string) => void;
  reps: string[];
}

export function MeetingFilters({
  repFilter,
  onRepFilterChange,
  companyFilter,
  onCompanyFilterChange,
  stageFilter,
  onStageFilterChange,
  reps,
}: MeetingFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <Select value={repFilter} onValueChange={(v) => onRepFilterChange(v ?? "all")}>
        <SelectTrigger className="w-[180px]">
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
        <SelectTrigger className="w-[180px]">
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
        className="w-[200px]"
      />
    </div>
  );
}
