import { getStageBgClass, getStageLabel } from "@/lib/utils/stage";

interface StageTypeBadgeProps {
  stage: string | null;
  className?: string;
}

export function StageTypeBadge({ stage, className = "" }: StageTypeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStageBgClass(stage)} ${className}`}
    >
      {getStageLabel(stage)}
    </span>
  );
}
