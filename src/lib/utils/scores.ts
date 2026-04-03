/**
 * Safe JSONB parsing utilities.
 *
 * JSONB fields in scored_meetings may be:
 * - null (meeting not scored or field not applicable for stage type)
 * - a JSON object (parsed by Supabase)
 * - a JSON string (edge case, shouldn't happen but handle gracefully)
 */

export function safeParseJson<T>(json: unknown, fallback: T): T {
  if (json === null || json === undefined) return fallback;
  if (typeof json === "string") {
    try {
      return JSON.parse(json) as T;
    } catch {
      return fallback;
    }
  }
  return json as T;
}

export function extractNumericScore(
  scoreObj: unknown,
  field: string = "overall_score"
): number | null {
  if (!scoreObj || typeof scoreObj !== "object") return null;
  const val = (scoreObj as Record<string, unknown>)[field];
  return typeof val === "number" ? val : null;
}

export function extractStringField(
  obj: unknown,
  field: string
): string | null {
  if (!obj || typeof obj !== "object") return null;
  const val = (obj as Record<string, unknown>)[field];
  return typeof val === "string" ? val : null;
}

export function extractArrayField<T>(
  obj: unknown,
  field: string
): T[] {
  if (!obj || typeof obj !== "object") return [];
  const val = (obj as Record<string, unknown>)[field];
  return Array.isArray(val) ? (val as T[]) : [];
}
