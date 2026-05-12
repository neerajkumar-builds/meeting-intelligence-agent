import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/reps/[name]/internal-insights
 * READ-ONLY - fetches internal_summary JSONB from scored_meetings for internal meetings.
 * Never writes to any table.
 */

interface ActionItem {
  action: string;
  owner: string;
  priority?: string;
  deadline?: string;
  meetingId: string;
  topic: string;
}

interface Decision {
  decision: string;
  meetingId: string;
  topic: string;
}

interface ClientRef {
  clientName: string;
  sentiment: string;
  context: string;
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

    // READ-ONLY query
    const { data: meetings, error } = await supabase
      .from("scored_meetings")
      .select("id, topic, start_time, scoring_stage_type, overall_score, internal_summary")
      .eq("host_name", repName)
      .in("scoring_stage_type", ["internal", "internal_client_meeting"])
      .not("internal_summary", "is", null)
      .order("start_time", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!meetings || meetings.length === 0) {
      return Response.json({ insights: null });
    }

    const actionItems: ActionItem[] = [];
    const decisions: Decision[] = [];
    const clientRefs: ClientRef[] = [];

    for (const m of meetings) {
      const is = m.internal_summary as Record<string, unknown> | null;
      if (!is) continue;
      const ref = { meetingId: m.id as string, topic: (m.topic as string) ?? "Meeting" };

      const actions = is.action_items;
      if (Array.isArray(actions)) {
        for (const a of actions as { action: string; owner: string; priority?: string; deadline?: string }[]) {
          if (a.action?.trim()) {
            actionItems.push({ action: a.action.trim(), owner: a.owner ?? "Unassigned", priority: a.priority, deadline: a.deadline, ...ref });
          }
        }
      }

      const decs = is.decisions_made;
      if (Array.isArray(decs)) {
        for (const d of decs as { decision: string }[]) {
          if (d.decision?.trim()) {
            decisions.push({ decision: d.decision.trim(), ...ref });
          }
        }
      }

      const refs = is.client_references;
      if (Array.isArray(refs)) {
        for (const r of refs as { client_name: string; sentiment?: string; context?: string }[]) {
          if (r.client_name?.trim()) {
            clientRefs.push({ clientName: r.client_name.trim(), sentiment: r.sentiment ?? "neutral", context: r.context ?? "", ...ref });
          }
        }
      }
    }

    return Response.json({
      insights: {
        meetingsAnalyzed: meetings.length,
        actionItems,
        decisions,
        clientRefs,
      },
    });
  } catch (err) {
    console.error("Internal insights API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
