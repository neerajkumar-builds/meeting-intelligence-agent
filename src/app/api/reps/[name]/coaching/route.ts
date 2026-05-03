import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/reps/[name]/coaching
 * READ-ONLY — fetches rep_score JSONB from scored_meetings, aggregates coaching patterns.
 * Never writes to any table.
 */

interface Insight {
  text: string;
  meetingId: string;
  topic: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const repName = decodeURIComponent(name);
    const supabase = createServerSupabase();

    // READ-ONLY query — only select, never insert/update/delete
    const { data: meetings, error } = await supabase
      .from("scored_meetings")
      .select("id, topic, start_time, scoring_stage_type, overall_score, rep_score")
      .eq("host_name", repName)
      .or("scoring_stage_type.neq.internal,scoring_stage_type.is.null")
      .not("rep_score", "is", null)
      .order("start_time", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!meetings || meetings.length === 0) {
      return Response.json({ coaching: null });
    }

    const strengths: Insight[] = [];
    const improvements: Insight[] = [];
    const blindSpots: Insight[] = [];
    const recommendations: Insight[] = [];
    const dealProgressions: Insight[] = [];

    for (const m of meetings) {
      const rs = m.rep_score as Record<string, unknown> | null;
      if (!rs) continue;
      const ref = { meetingId: m.id as string, topic: (m.topic as string) ?? "Meeting" };

      if (typeof rs.strengths === "string" && rs.strengths.trim()) {
        strengths.push({ text: rs.strengths.trim(), ...ref });
      }
      if (typeof rs.areas_for_improvement === "string" && rs.areas_for_improvement.trim()) {
        improvements.push({ text: rs.areas_for_improvement.trim(), ...ref });
      }
      if (typeof rs.blind_spots === "string" && rs.blind_spots.trim()) {
        blindSpots.push({ text: rs.blind_spots.trim(), ...ref });
      }
      if (typeof rs.coaching_recommendations === "string" && rs.coaching_recommendations.trim()) {
        recommendations.push({ text: rs.coaching_recommendations.trim(), ...ref });
      }
      if (typeof rs.deal_progression_assessment === "string" && rs.deal_progression_assessment.trim()) {
        dealProgressions.push({ text: rs.deal_progression_assessment.trim(), ...ref });
      }
    }

    return Response.json({
      coaching: {
        meetingsAnalyzed: meetings.length,
        strengths,
        improvements,
        blindSpots,
        recommendations,
        dealProgressions,
      },
    });
  } catch (err) {
    console.error("Coaching API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
