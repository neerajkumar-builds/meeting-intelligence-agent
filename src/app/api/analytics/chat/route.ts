import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Always return 200 — analytics should never fail visibly
  try {
    const body = await request.json();
    const supabase = await createServerSupabase();

    await supabase.from("chat_analytics").insert({
      session_id: body.sessionId ?? "unknown",
      user_email: body.userEmail ?? null,
      event_type: body.eventType ?? "unknown",
      query: body.query ?? null,
      response_length: body.responseLength ?? null,
      sources_count: body.sourcesCount ?? 0,
      chunks_retrieved: body.chunksRetrieved ?? 0,
      had_chart: body.hadChart ?? false,
      latency_ms: body.latencyMs ?? null,
      error_message: body.errorMessage ?? null,
    });
  } catch {
    // Silent failure — analytics never blocks
  }

  return Response.json({ ok: true });
}
