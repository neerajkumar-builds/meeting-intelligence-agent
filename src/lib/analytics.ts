/**
 * Fire-and-forget chat analytics logger.
 * Never awaited, never blocks UI. If it fails, nobody notices.
 */
export function logChatEvent(event: {
  sessionId: string;
  eventType: string;
  userEmail?: string;
  query?: string;
  responseLength?: number;
  sourcesCount?: number;
  chunksRetrieved?: number;
  hadChart?: boolean;
  latencyMs?: number;
  errorMessage?: string;
}) {
  fetch("/api/analytics/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {});
}
