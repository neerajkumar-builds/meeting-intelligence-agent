import { createClient } from "@supabase/supabase-js";
import { SECTIONS, SECTION_CHANNEL_MAP, getSectionForStageType } from "@/lib/constants";
import type { SectionKey } from "@/lib/constants";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : "https://dashboard-jet-seven-93.vercel.app";

type DigestType = "monday_priorities" | "daily_actions" | "friday_review";

interface ScoredMeeting {
  id: string;
  topic: string;
  host_name: string;
  company_name: string | null;
  scoring_stage_type: string | null;
  overall_score: number | null;
  client_health_score: number | null;
  scored_at: string | null;
  start_time: string | null;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    if (secret !== process.env.CRON_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(request.url);
  const digestType = (url.searchParams.get("type") || detectDigestType()) as DigestType;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const { startDate, endDate } = getDateRange(digestType, now);

    const { data: meetings, error } = await supabase
      .from("scored_meetings")
      .select("id, topic, host_name, company_name, scoring_stage_type, overall_score, client_health_score, scored_at, start_time")
      .gte("scored_at", startDate.toISOString())
      .lte("scored_at", endDate.toISOString())
      .not("scoring_stage_type", "is", null)
      .order("scored_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const allMeetings = meetings as ScoredMeeting[];
    const results: { section: string; channel: string; sent: boolean; meetingCount: number }[] = [];

    for (const sectionKey of ["sales", "cs", "internal"] as SectionKey[]) {
      const config = SECTIONS[sectionKey];
      const channelId = SECTION_CHANNEL_MAP[sectionKey];
      if (!channelId) continue;

      const sectionMeetings = allMeetings.filter(
        (m) => m.scoring_stage_type && config.stageTypes.includes(m.scoring_stage_type as never)
      );

      if (sectionMeetings.length === 0 && digestType === "daily_actions") {
        results.push({ section: sectionKey, channel: channelId, sent: false, meetingCount: 0 });
        continue;
      }

      const message = buildDigestMessage(digestType, sectionKey, sectionMeetings, now);
      const sent = await sendToSlack(message.title, message.body, channelId);
      results.push({ section: sectionKey, channel: channelId, sent, meetingCount: sectionMeetings.length });
    }

    return Response.json({
      digestType,
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
      results,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Digest error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

function detectDigestType(): DigestType {
  const day = new Date().getDay();
  if (day === 1) return "monday_priorities";
  if (day === 5) return "friday_review";
  return "daily_actions";
}

function getDateRange(type: DigestType, now: Date): { startDate: Date; endDate: Date } {
  const endDate = new Date(now);

  switch (type) {
    case "monday_priorities": {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      return { startDate, endDate };
    }
    case "daily_actions": {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      return { startDate, endDate };
    }
    case "friday_review": {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 5);
      return { startDate, endDate };
    }
  }
}

function buildDigestMessage(
  type: DigestType,
  section: SectionKey,
  meetings: ScoredMeeting[],
  now: Date
): { title: string; body: string } {
  const sectionLabel = SECTIONS[section].shortLabel;
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  switch (type) {
    case "monday_priorities":
      return buildMondayPriorities(sectionLabel, meetings, dateStr);
    case "daily_actions":
      return buildDailyActions(sectionLabel, meetings, dateStr);
    case "friday_review":
      return buildFridayReview(sectionLabel, meetings, dateStr);
  }
}

function buildMondayPriorities(section: string, meetings: ScoredMeeting[], dateStr: string) {
  const title = `${section} - Week Priorities (${dateStr})`;

  const lowScores = meetings.filter((m) => m.overall_score != null && m.overall_score < 6);
  const atRisk = meetings.filter((m) => m.client_health_score != null && m.client_health_score < 5);
  const avgScore = meetings.length > 0
    ? (meetings.reduce((sum, m) => sum + (m.overall_score ?? 0), 0) / meetings.length).toFixed(1)
    : "N/A";

  const lines: string[] = [
    `*${meetings.length} meetings scored last week* | Avg Score: ${avgScore}`,
    "",
  ];

  if (atRisk.length > 0) {
    lines.push(`:rotating_light: *At-Risk Accounts (${atRisk.length}):*`);
    for (const m of atRisk.slice(0, 5)) {
      lines.push(`  - <${DASHBOARD_URL}/meetings/${m.id}|${m.company_name || m.topic}> - Health: ${m.client_health_score}`);
    }
    lines.push("");
  }

  if (lowScores.length > 0) {
    lines.push(`:warning: *Low Scores (${lowScores.length}):*`);
    for (const m of lowScores.slice(0, 5)) {
      lines.push(`  - <${DASHBOARD_URL}/meetings/${m.id}|${m.topic}> - Score: ${m.overall_score} (${m.host_name})`);
    }
    lines.push("");
  }

  const topPerformers = [...meetings]
    .sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0))
    .slice(0, 3);
  if (topPerformers.length > 0) {
    lines.push(`:star: *Top Meetings:*`);
    for (const m of topPerformers) {
      lines.push(`  - <${DASHBOARD_URL}/meetings/${m.id}|${m.topic}> - Score: ${m.overall_score} (${m.host_name})`);
    }
  }

  return { title, body: lines.join("\n") };
}

function buildDailyActions(section: string, meetings: ScoredMeeting[], dateStr: string) {
  const title = `${section} - Today's Actions (${dateStr})`;

  if (meetings.length === 0) {
    return { title, body: "No new meetings scored in the last 24 hours." };
  }

  const lines: string[] = [
    `*${meetings.length} meeting${meetings.length !== 1 ? "s" : ""} scored since yesterday:*`,
    "",
  ];

  for (const m of meetings.slice(0, 10)) {
    const scoreStr = m.overall_score != null ? `${m.overall_score}/10` : "pending";
    const healthStr = m.client_health_score != null ? ` | Health: ${m.client_health_score}` : "";
    const icon = (m.overall_score ?? 10) < 5 ? ":red_circle:" : (m.overall_score ?? 10) < 7 ? ":large_yellow_circle:" : ":large_green_circle:";
    lines.push(`${icon} <${DASHBOARD_URL}/meetings/${m.id}|${m.topic}> - ${scoreStr}${healthStr}`);
    lines.push(`    _${m.host_name}${m.company_name ? ` - ${m.company_name}` : ""}_`);
  }

  const alerts = meetings.filter((m) => m.overall_score != null && m.overall_score < 5);
  if (alerts.length > 0) {
    lines.push("");
    lines.push(`:rotating_light: *${alerts.length} meeting${alerts.length !== 1 ? "s" : ""} need attention* (score < 5)`);
  }

  return { title, body: lines.join("\n") };
}

function buildFridayReview(section: string, meetings: ScoredMeeting[], dateStr: string) {
  const title = `${section} - Week in Review (${dateStr})`;

  const avgScore = meetings.length > 0
    ? (meetings.reduce((sum, m) => sum + (m.overall_score ?? 0), 0) / meetings.length).toFixed(1)
    : "N/A";

  const avgHealth = meetings.filter((m) => m.client_health_score != null).length > 0
    ? (meetings.filter((m) => m.client_health_score != null)
        .reduce((sum, m) => sum + (m.client_health_score ?? 0), 0) /
        meetings.filter((m) => m.client_health_score != null).length).toFixed(1)
    : "N/A";

  const repScores: Record<string, { total: number; count: number }> = {};
  for (const m of meetings) {
    if (!m.host_name || m.overall_score == null) continue;
    if (!repScores[m.host_name]) repScores[m.host_name] = { total: 0, count: 0 };
    repScores[m.host_name].total += m.overall_score;
    repScores[m.host_name].count += 1;
  }

  const repRanking = Object.entries(repScores)
    .map(([name, { total, count }]) => ({ name, avg: total / count, count }))
    .sort((a, b) => b.avg - a.avg);

  const lines: string[] = [
    `:bar_chart: *Weekly Summary*`,
    `Meetings: ${meetings.length} | Avg Score: ${avgScore} | Avg Health: ${avgHealth}`,
    "",
  ];

  if (repRanking.length > 0) {
    lines.push(`*Rep Performance:*`);
    for (const r of repRanking.slice(0, 5)) {
      const medal = repRanking.indexOf(r) === 0 ? ":first_place_medal:" : "";
      lines.push(`  ${medal} ${r.name}: ${r.avg.toFixed(1)} avg (${r.count} meetings)`);
    }
    lines.push("");
  }

  const best = [...meetings].sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0))[0];
  const worst = [...meetings].sort((a, b) => (a.overall_score ?? 0) - (b.overall_score ?? 0))[0];

  if (best) {
    lines.push(`:trophy: *Best:* <${DASHBOARD_URL}/meetings/${best.id}|${best.topic}> (${best.overall_score}) - ${best.host_name}`);
  }
  if (worst && worst.id !== best?.id) {
    lines.push(`:eyes: *Needs Work:* <${DASHBOARD_URL}/meetings/${worst.id}|${worst.topic}> (${worst.overall_score}) - ${worst.host_name}`);
  }

  return { title, body: lines.join("\n") };
}

async function sendToSlack(title: string, body: string, channelId: string): Promise<boolean> {
  const botToken = process.env.SLACK_BOT_TOKEN;
  if (!botToken) return false;

  const blocks = [
    { type: "header", text: { type: "plain_text", text: title.slice(0, 150), emoji: true } },
    { type: "section", text: { type: "mrkdwn", text: body.slice(0, 2800) } },
    { type: "context", elements: [
      { type: "mrkdwn", text: `_Meeting Intelligence_ | <${DASHBOARD_URL}|Open Dashboard>` },
    ]},
  ];

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: `Bearer ${botToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ channel: channelId, blocks, text: `${title}: ${body.slice(0, 200)}` }),
  });

  const data = await res.json();
  if (!data.ok) console.error("Slack digest send error:", data.error);
  return data.ok === true;
}
