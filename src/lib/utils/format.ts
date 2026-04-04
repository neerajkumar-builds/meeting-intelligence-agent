import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return "-";
  }
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return "-";
  }
}

export function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return "-";
  }
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return "-";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatScore(score: number | null, decimals = 1): string {
  if (score === null) return "-";
  return score.toFixed(decimals);
}
