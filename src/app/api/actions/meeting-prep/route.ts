import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { companyName, currentMeetingId } = await request.json();

    if (!companyName) {
      return Response.json({ error: "Company name required" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Fetch all meetings with this company
    let query = supabase
      .from("scored_meetings")
      .select(
        "id, topic, host_name, primary_participant_name, start_time, meeting_summary, scoring_stage_type, overall_score, client_health_score, meeting_score, rep_score, internal_summary"
      )
      .eq("company_name", companyName)
      .eq("status", "completed")
      .order("start_time", { ascending: false })
      .limit(10);

    if (currentMeetingId) {
      query = query.neq("id", currentMeetingId);
    }

    const { data: meetings, error: dbError } = await query;

    if (dbError) {
      return Response.json({ error: "Failed to fetch meetings" }, { status: 500 });
    }

    if (!meetings || meetings.length === 0) {
      return Response.json({
        brief: `No previous meetings found with ${companyName}. This appears to be the first engagement.`,
      });
    }

    const anthropic = new Anthropic();

    const meetingContext = meetings
      .map(
        (m) => `
Meeting: ${m.topic} (${m.start_time})
Rep: ${m.host_name} | Stage: ${m.scoring_stage_type} | Score: ${m.overall_score}/10
Summary: ${m.meeting_summary ?? "N/A"}
${m.meeting_score ? `Key Details: ${JSON.stringify(m.meeting_score).substring(0, 500)}` : ""}
${m.rep_score ? `Rep Notes: ${JSON.stringify(m.rep_score).substring(0, 300)}` : ""}`
      )
      .join("\n---\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `You are preparing a pre-call briefing for a FullFunnel team member about to meet with a client.
Generate a structured prep brief that includes:

## Company: [Name]
**Meetings to date:** [count]
**Relationship health:** [trend assessment]

## Key Context
- What stage is the engagement in?
- What were the main discussion topics across meetings?
- What is the current sentiment/health trend?

## Open Action Items
- List any unresolved action items from previous meetings (with owners)

## Watch Out For
- Any risks, concerns, or blind spots flagged in previous scores
- Areas where the rep was coached to improve

## Suggested Talking Points
- 3-5 specific topics to raise based on prior meeting context

Be specific — cite meeting dates and scores. Use first names.`,
      messages: [
        {
          role: "user",
          content: `Prepare a call prep brief for the next meeting with ${companyName}.

Previous meetings (most recent first):
${meetingContext}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({ brief: text });
  } catch (error) {
    console.error("Meeting prep error:", error);
    return Response.json({ error: "Failed to generate prep brief" }, { status: 500 });
  }
}
