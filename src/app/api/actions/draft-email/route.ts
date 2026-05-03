import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase/server";

const TEMPLATES: Record<string, { label: string; systemPrompt: string }> = {
  client_followup: {
    label: "Client Follow-Up",
    systemPrompt: `You are writing a professional follow-up email from a FullFunnel team member to a client after a meeting.
Use the meeting transcript, action items, and summary to write a concise, warm, and actionable follow-up.
Include: greeting, brief meeting recap (2-3 sentences), action items with owners and deadlines, next steps, and sign-off.
Use first names. Keep it under 300 words. Do not use overly formal language.
Return JSON: { "subject": "...", "body": "..." }`,
  },
  internal_recap: {
    label: "Internal Recap",
    systemPrompt: `You are writing an internal recap email for FullFunnel leadership summarizing a client meeting.
Include: who attended, key discussion points, scores if available, action items, risks or concerns, and recommended next steps.
Be direct and concise -leadership reads dozens of these. Keep it under 250 words.
Return JSON: { "subject": "...", "body": "..." }`,
  },
  executive_briefing: {
    label: "Executive Briefing",
    systemPrompt: `You are writing a brief executive summary of a meeting for FullFunnel's CEO.
Focus on: deal status/sentiment, key risks, strategic implications, and what needs CEO attention.
Keep it to 3-5 bullet points max. No fluff.
Return JSON: { "subject": "...", "body": "..." }`,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { meetingId, template } = await request.json();

    if (!meetingId || !template || !TEMPLATES[template]) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: meeting, error: dbError } = await supabase
      .from("scored_meetings")
      .select(
        "topic, host_name, company_name, primary_participant_name, start_time, meeting_summary, transcript_text, meeting_score, rep_score, internal_summary, scoring_stage_type"
      )
      .eq("id", meetingId)
      .single();

    if (dbError || !meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    const anthropic = new Anthropic();
    const templateConfig = TEMPLATES[template];

    const response = await anthropic.messages.create({
      model: process.env.CHAT_MODEL ?? "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: templateConfig.systemPrompt,
      messages: [
        {
          role: "user",
          content: `Meeting: ${meeting.topic}
Rep: ${meeting.host_name}
Company: ${meeting.company_name ?? "N/A"}
Contact: ${meeting.primary_participant_name ?? "N/A"}
Date: ${meeting.start_time}
Stage: ${meeting.scoring_stage_type}

Summary: ${meeting.meeting_summary ?? "No summary available"}

Scores: ${JSON.stringify(meeting.meeting_score ?? {}, null, 2)}

Rep Analysis: ${JSON.stringify(meeting.rep_score ?? {}, null, 2)}

${meeting.scoring_stage_type === "internal" && meeting.internal_summary ? `Internal Summary: ${JSON.stringify(meeting.internal_summary, null, 2)}` : ""}

Transcript (first 8000 chars):
${(meeting.transcript_text ?? "").substring(0, 8000)}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Try to parse as JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Response.json(parsed);
      }
    } catch {
      // Fall through to plain text
    }

    return Response.json({ subject: `Re: ${meeting.topic}`, body: text });
  } catch (error) {
    console.error("Draft email error:", error);
    return Response.json({ error: "Failed to generate email" }, { status: 500 });
  }
}
