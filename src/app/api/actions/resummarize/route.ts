import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase/server";

const FORMATS: Record<string, { label: string; systemPrompt: string }> = {
  jake_sop: {
    label: "Jake SOP Format",
    systemPrompt: `Re-summarize this meeting in Jake's SOP format:

## Action Items
### Client Actions
- [Action] -Owner: [Name], Deadline: [Date]

### FullFunnel Actions
- [Action] -Owner: [Name], Deadline: [Date]

### Kantata Tasks
- [Task title] -Assignee: [Name]

## Key Discussion Points
[Bullet points]

## Next Steps
[Bullet points]

Be specific with names, dates, and deliverables. Use first names only.`,
  },
  executive_summary: {
    label: "Executive Summary",
    systemPrompt: `Write a 3-5 sentence executive summary of this meeting. Focus on: what was discussed, what was decided, what happens next, and any risks. No bullets -flowing prose. Keep it under 100 words.`,
  },
  bullet_points: {
    label: "Bullet Points",
    systemPrompt: `Summarize this meeting as concise bullet points:
- Key topics discussed
- Decisions made
- Action items (with owners)
- Open questions
- Next meeting/deadline

Maximum 15 bullets. Each bullet should be one line.`,
  },
  client_mom: {
    label: "Client Minutes of Meeting",
    systemPrompt: `Write professional Minutes of Meeting (MOM) suitable for sharing with the client. Include:

**Meeting:** [Topic]
**Date:** [Date]
**Attendees:** [Names]

**Discussion Points:**
1. [Point]

**Agreed Actions:**
| # | Action | Owner | Deadline |
|---|--------|-------|----------|

**Next Meeting:** [Date/TBD]

Keep it professional, factual, and free of internal FullFunnel commentary or scores.`,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { meetingId, format } = await request.json();

    if (!meetingId || !format || !FORMATS[format]) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: meeting, error: dbError } = await supabase
      .from("scored_meetings")
      .select(
        "topic, host_name, company_name, primary_participant_name, start_time, duration_minutes, meeting_summary, transcript_text, meeting_score, rep_score, internal_summary, scoring_stage_type"
      )
      .eq("id", meetingId)
      .single();

    if (dbError || !meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    const anthropic = new Anthropic();
    const formatConfig = FORMATS[format];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: formatConfig.systemPrompt,
      messages: [
        {
          role: "user",
          content: `Meeting: ${meeting.topic}
Rep: ${meeting.host_name}
Company: ${meeting.company_name ?? "N/A"}
Contact: ${meeting.primary_participant_name ?? "N/A"}
Date: ${meeting.start_time}
Duration: ${meeting.duration_minutes ?? "?"} minutes

Summary: ${meeting.meeting_summary ?? "No summary"}

${meeting.internal_summary ? `Internal Analysis: ${JSON.stringify(meeting.internal_summary, null, 2)}` : ""}
${meeting.meeting_score ? `Scores: ${JSON.stringify(meeting.meeting_score, null, 2)}` : ""}

Transcript (first 10000 chars):
${(meeting.transcript_text ?? "").substring(0, 10000)}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({ summary: text });
  } catch (error) {
    console.error("Resummarize error:", error);
    return Response.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
