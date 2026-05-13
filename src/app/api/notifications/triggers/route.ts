import { createServerSupabase } from "@/lib/supabase/server";

export interface PipelineTrigger {
  company_name: string;
  trigger_type: "deal_slipping" | "deal_accelerating" | "poor_discovery";
  current_meeting_id: string;
  previous_meeting_id: string | null;
  current_score: number | null;
  previous_score: number | null;
  score_delta: number | null;
  urgency: "high" | "medium";
  details: Record<string, unknown>;
}

export async function GET() {
  try {
    const supabase = createServerSupabase();

    const { data, error } = await supabase.rpc("detect_pipeline_triggers");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const triggers = (data ?? []) as PipelineTrigger[];

    return Response.json({
      triggers,
      count: triggers.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Pipeline triggers error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
