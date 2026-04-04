import { getScoreBand } from "@/lib/constants";
import { formatScore } from "@/lib/utils/format";

interface ScoreBadgeProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-sm px-2 py-0.5",
  lg: "text-base px-2.5 py-1 font-semibold",
};

const COLOR_CLASSES = {
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  if (score === null) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 ${SIZE_CLASSES[size]}`}
      >
        -
      </span>
    );
  }

  const band = getScoreBand(score);
  const colorClass = band ? COLOR_CLASSES[band.color] : COLOR_CLASSES.red;

  return (
    <span
      className={`inline-flex items-center rounded-full ${colorClass} ${SIZE_CLASSES[size]}`}
    >
      {formatScore(score)}
    </span>
  );
}
