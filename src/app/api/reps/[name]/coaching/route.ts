import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/reps/[name]/coaching
 * READ-ONLY — fetches rep_score JSONB from scored_meetings, aggregates coaching patterns.
 * Never writes to any table.
 */
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
      .not("rep_score", "is", null)
      .order("start_time", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!meetings || meetings.length === 0) {
      return Response.json({ coaching: null });
    }

    // Aggregate coaching insights across all meetings
    const strengths: string[] = [];
    const improvements: string[] = [];
    const blindSpots: string[] = [];
    const recommendations: string[] = [];
    const dealProgressions: string[] = [];

    for (const m of meetings) {
      const rs = m.rep_score as Record<string, unknown> | null;
      if (!rs) continue;

      if (typeof rs.strengths === "string" && rs.strengths.trim()) {
        strengths.push(rs.strengths.trim());
      }
      if (typeof rs.areas_for_improvement === "string" && rs.areas_for_improvement.trim()) {
        improvements.push(rs.areas_for_improvement.trim());
      }
      if (typeof rs.blind_spots === "string" && rs.blind_spots.trim()) {
        blindSpots.push(rs.blind_spots.trim());
      }
      if (typeof rs.coaching_recommendations === "string" && rs.coaching_recommendations.trim()) {
        recommendations.push(rs.coaching_recommendations.trim());
      }
      if (typeof rs.deal_progression_assessment === "string" && rs.deal_progression_assessment.trim()) {
        dealProgressions.push(rs.deal_progression_assessment.trim());
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
