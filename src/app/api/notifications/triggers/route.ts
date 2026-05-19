import { createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { SECTION_CHANNEL_MAP, getSectionForStageType } from "@/lib/constants";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard-jet-seven-93.vercel.app";

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

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { meeting_id } = await request.json();
    if (!meeting_id) {
      return Response.json({ error: "meeting_id required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: meeting, error } = await supabase
      .from("scored_meetings")
      .select("id, topic, host_name, company_name, scoring_stage_type, overall_score, client_health_score")
      .eq("id", meeting_id)
      .single();

    if (error || !meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    const section = getSectionForStageType(meeting.scoring_stage_type);
    const channelId = SECTION_CHANNEL_MAP[section];
    if (!channelId) {
      return Response.json({ sent: false, reason: "no channel for section" });
    }

    const score = meeting.overall_score;
    const health = meeting.client_health_score;
    const isLowScore = score != null && score < 5;
    const isLowHealth = health != null && health < 5;

    const icon = isLowScore || isLowHealth ? ":rotating_light:" : ":white_check_mark:";
    const title = `${icon} Meeting Scored: ${meeting.topic}`;

    const lines: string[] = [
      `*${meeting.topic}*`,
      `Rep: ${meeting.host_name}${meeting.company_name ? ` | Company: ${meeting.company_name}` : ""}`,
      `Score: ${score ?? "N/A"}/10${health != null ? ` | Health: ${health}/10` : ""}`,
    ];

    if (isLowScore) lines.push(`:warning: *Low score - needs attention*`);
    if (isLowHealth) lines.push(`:warning: *Low health - at-risk account*`);

    lines.push(`\n<${DASHBOARD_URL}/meetings/${meeting.id}|View Meeting Details>`);

    const sent = await sendToSlack(title, lines.join("\n"), channelId);

    return Response.json({ sent, section, channelId, meetingId: meeting.id });
  } catch (error) {
    console.error("Real-time trigger error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function sendToSlack(title: string, body: string, channelId: string): Promise<boolean> {
  const botToken = process.env.SLACK_BOT_TOKEN;
  if (!botToken) return false;

  const blocks = [
    { type: "header", text: { type: "plain_text", text: title.slice(0, 150), emoji: true } },
    { type: "section", text: { type: "mrkdwn", text: body.slice(0, 2800) } },
  ];

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: `Bearer ${botToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ channel: channelId, blocks, text: `${title}: ${body.slice(0, 200)}` }),
  });

  const data = await res.json();
  if (!data.ok) console.error("Slack real-time trigger error:", data.error);
  return data.ok === true;
}
