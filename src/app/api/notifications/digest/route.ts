import { createClient } from "@supabase/supabase-js";
import { SECTIONS, SECTION_CHANNEL_MAP } from "@/lib/constants";
import type { SectionKey } from "@/lib/constants";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard-jet-seven-93.vercel.app";

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
  duration_minutes: number | null;
  meeting_score: Record<string, unknown> | null;
  rep_score: Record<string, unknown> | null;
  icp_score: Record<string, unknown> | null;
}

interface PipelineTrigger {
  company_name: string;
  trigger_type: string;
  current_score: number | null;
  previous_score: number | null;
  score_delta: number | null;
  urgency: string;
}

interface StaleCompany {
  company_name: string;
  days_since: number;
  last_health: number | null;
  last_score: number | null;
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
      .select("id, topic, host_name, company_name, scoring_stage_type, overall_score, client_health_score, scored_at, start_time, duration_minutes, meeting_score, rep_score, icp_score")
      .gte("scored_at", startDate.toISOString())
      .lte("scored_at", endDate.toISOString())
      .not("scoring_stage_type", "is", null)
      .eq("status", "completed")
      .order("scored_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const allMeetings = meetings as ScoredMeeting[];

    const triggers = await fetchPipelineTriggers(supabase);
    const staleDeals = await fetchStaleDeals(supabase);

    const results: { section: string; channel: string; sent: boolean; meetingCount: number; skippedReason?: string }[] = [];

    for (const sectionKey of ["sales", "cs", "internal"] as SectionKey[]) {
      const config = SECTIONS[sectionKey];
      const channelId = SECTION_CHANNEL_MAP[sectionKey];
      if (!channelId) continue;

      const skipReason = await shouldSkipSection(supabase, sectionKey, digestType);
      if (skipReason) {
        results.push({ section: sectionKey, channel: channelId, sent: false, meetingCount: 0, skippedReason: skipReason });
        continue;
      }

      const sectionMeetings = allMeetings.filter(
        (m) => m.scoring_stage_type && config.stageTypes.includes(m.scoring_stage_type as never)
      );

      const sectionTriggers = sectionKey === "sales" ? triggers : triggers.filter(() => false);

      if (sectionMeetings.length === 0 && digestType === "daily_actions") {
        results.push({ section: sectionKey, channel: channelId, sent: false, meetingCount: 0 });
        continue;
      }

      const message = buildDigestMessage(digestType, sectionKey, sectionMeetings, now, sectionTriggers, staleDeals);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPipelineTriggers(supabase: any): Promise<PipelineTrigger[]> {
  try {
    const { data } = await supabase.rpc("detect_pipeline_triggers");
    return (data ?? []) as PipelineTrigger[];
  } catch {
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchStaleDeals(supabase: any): Promise<StaleCompany[]> {
  try {
    const { data } = await supabase
      .from("scored_meetings")
      .select("company_name, scored_at, client_health_score, overall_score")
      .not("company_name", "is", null)
      .not("scoring_stage_type", "is", null)
      .eq("status", "completed")
      .order("scored_at", { ascending: false });

    if (!data) return [];

    const latestByCompany = new Map<string, { scored_at: string; health: number | null; score: number | null }>();
    for (const row of data as Array<{ company_name: string; scored_at: string; client_health_score: number | null; overall_score: number | null }>) {
      if (!latestByCompany.has(row.company_name)) {
        latestByCompany.set(row.company_name, {
          scored_at: row.scored_at,
          health: row.client_health_score,
          score: row.overall_score,
        });
      }
    }

    const now = Date.now();
    const stale: StaleCompany[] = [];
    for (const [name, info] of latestByCompany) {
      const daysSince = Math.floor((now - new Date(info.scored_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince >= 14) {
        stale.push({ company_name: name, days_since: daysSince, last_health: info.health, last_score: info.score });
      }
    }
    return stale.sort((a, b) => b.days_since - a.days_since).slice(0, 5);
  } catch {
    return [];
  }
}

interface NotifPref {
  is_active: boolean;
  frequency: string;
}

async function shouldSkipSection(
  supabase: { from: (table: string) => ReturnType<ReturnType<typeof createClient>["from"]> },
  sectionKey: string,
  digestType: DigestType
): Promise<string | null> {
  const { data } = await supabase
    .from("notification_preferences")
    .select("is_active, frequency")
    .eq("channel", "slack")
    .in("section", [sectionKey, "all"]);

  const prefs = (data ?? []) as NotifPref[];
  if (prefs.length === 0) return null;

  const activePrefs = prefs.filter((p) => p.is_active);
  if (activePrefs.length === 0) return "all_inactive";

  const frequencyMatch = activePrefs.some((p) => {
    if (p.frequency === "realtime" || p.frequency === "hourly") return true;
    if (p.frequency === "daily") return true;
    if (p.frequency === "weekly") return digestType !== "daily_actions";
    return true;
  });
  if (!frequencyMatch) return "frequency_mismatch";

  return null;
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

function getSentiment(m: ScoredMeeting): string | null {
  const ms = m.meeting_score;
  if (!ms) return null;
  return (ms.deal_sentiment as string) ?? null;
}

function getNextActions(m: ScoredMeeting): string | null {
  const ms = m.meeting_score;
  if (!ms) return null;
  const actions = ms.next_actionables as string;
  if (!actions) return null;
  return actions.length > 80 ? actions.substring(0, 80) + "..." : actions;
}

function getIcpFit(m: ScoredMeeting): number | null {
  const icp = m.icp_score;
  if (!icp) return null;
  return (icp.icp_fit_score as number) ?? null;
}

function getCoachingHighlight(meetings: ScoredMeeting[]): string | null {
  for (const m of meetings) {
    const rs = m.rep_score;
    if (!rs) continue;
    const recs = rs.coaching_recommendations as string;
    if (recs && recs.length > 10) {
      return recs.length > 100 ? recs.substring(0, 100) + "..." : recs;
    }
  }
  return null;
}

function sentimentIcon(sentiment: string | null): string {
  if (!sentiment) return "";
  const s = sentiment.toLowerCase();
  if (s.includes("positive") || s.includes("strong")) return " :chart_with_upwards_trend:";
  if (s.includes("negative") || s.includes("stall") || s.includes("cold")) return " :chart_with_downwards_trend:";
  return "";
}

function buildDigestMessage(
  type: DigestType,
  section: SectionKey,
  meetings: ScoredMeeting[],
  now: Date,
  triggers: PipelineTrigger[],
  staleDeals: StaleCompany[]
): { title: string; body: string } {
  const sectionLabel = SECTIONS[section].shortLabel;
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  switch (type) {
    case "monday_priorities":
      return buildMondayPriorities(sectionLabel, meetings, dateStr, triggers, staleDeals);
    case "daily_actions":
      return buildDailyActions(sectionLabel, meetings, dateStr);
    case "friday_review":
      return buildFridayReview(sectionLabel, meetings, dateStr);
  }
}

function buildMondayPriorities(
  section: string,
  meetings: ScoredMeeting[],
  dateStr: string,
  triggers: PipelineTrigger[],
  staleDeals: StaleCompany[]
) {
  const title = `${section} - What to Focus On (${dateStr})`;

  const avgScore = meetings.length > 0
    ? (meetings.reduce((sum, m) => sum + (m.overall_score ?? 0), 0) / meetings.length).toFixed(1)
    : "N/A";

  const lines: string[] = [
    `*${meetings.length} meetings scored last week* | Avg Score: ${avgScore}`,
    "",
  ];

  const slipping = triggers.filter((t) => t.trigger_type === "deal_slipping");
  const accelerating = triggers.filter((t) => t.trigger_type === "deal_accelerating");
  const poorDiscovery = triggers.filter((t) => t.trigger_type === "poor_discovery");

  if (slipping.length > 0 || accelerating.length > 0 || staleDeals.length > 0) {
    lines.push(`:dart: *Deals to Watch:*`);
    for (const t of slipping.slice(0, 3)) {
      const delta = t.score_delta != null ? ` (${t.previous_score} -> ${t.current_score})` : "";
      lines.push(`  :rotating_light: ${t.company_name} - health dropping${delta}`);
    }
    for (const t of accelerating.slice(0, 3)) {
      const delta = t.score_delta != null ? ` (${t.previous_score} -> ${t.current_score})` : "";
      lines.push(`  :chart_with_upwards_trend: ${t.company_name} - momentum building${delta}`);
    }
    for (const s of staleDeals.slice(0, 3)) {
      lines.push(`  :hourglass: ${s.company_name} - no meeting in ${s.days_since} days${s.last_health != null ? `, last health: ${s.last_health}` : ""}`);
    }
    lines.push("");
  }

  if (poorDiscovery.length > 0) {
    lines.push(`:warning: *Discovery Calls Needing Attention:*`);
    for (const t of poorDiscovery.slice(0, 3)) {
      lines.push(`  - ${t.company_name} - score: ${t.current_score}`);
    }
    lines.push("");
  }

  const icpMeetings = meetings.filter((m) => getIcpFit(m) != null);
  if (icpMeetings.length > 0) {
    const highFit = icpMeetings.filter((m) => (getIcpFit(m) ?? 0) >= 7).length;
    const midFit = icpMeetings.filter((m) => { const f = getIcpFit(m) ?? 0; return f >= 5 && f < 7; }).length;
    const lowFit = icpMeetings.filter((m) => (getIcpFit(m) ?? 0) < 5).length;
    lines.push(`:mag: *ICP Quality:* ${highFit} high-fit, ${midFit} mid-fit, ${lowFit} needs-work`);
    lines.push("");
  }

  const atRisk = meetings.filter((m) => m.client_health_score != null && m.client_health_score < 5);
  if (atRisk.length > 0) {
    lines.push(`:rotating_light: *At-Risk Accounts (${atRisk.length}):*`);
    for (const m of atRisk.slice(0, 5)) {
      lines.push(`  - <${DASHBOARD_URL}/meetings/${m.id}|${m.company_name || m.topic}> - Health: ${m.client_health_score}`);
    }
    lines.push("");
  }

  const repScores: Record<string, { total: number; count: number; best: ScoredMeeting | null }> = {};
  for (const m of meetings) {
    if (!m.host_name || m.overall_score == null) continue;
    if (!repScores[m.host_name]) repScores[m.host_name] = { total: 0, count: 0, best: null };
    repScores[m.host_name].total += m.overall_score;
    repScores[m.host_name].count += 1;
    if (!repScores[m.host_name].best || m.overall_score > (repScores[m.host_name].best?.overall_score ?? 0)) {
      repScores[m.host_name].best = m;
    }
  }

  const repRanking = Object.entries(repScores)
    .map(([name, { total, count }]) => ({ name, avg: total / count, count }))
    .sort((a, b) => b.avg - a.avg);

  if (repRanking.length > 0) {
    lines.push(`:busts_in_silhouette: *Team Focus:*`);
    for (const r of repRanking.slice(0, 5)) {
      lines.push(`  ${r.name}: ${r.count} meetings, avg ${r.avg.toFixed(1)}`);
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
    const sentiment = getSentiment(m);
    const sentIcon = sentimentIcon(sentiment);

    lines.push(`${icon} <${DASHBOARD_URL}/meetings/${m.id}|${m.topic}> - ${scoreStr}${healthStr}${sentIcon}`);
    lines.push(`    _${m.host_name}${m.company_name ? ` | ${m.company_name}` : ""}${sentiment ? ` | ${sentiment}` : ""}_`);

    const nextActions = getNextActions(m);
    if (nextActions) {
      lines.push(`    :arrow_right: ${nextActions}`);
    }
  }

  const alerts = meetings.filter((m) => m.overall_score != null && m.overall_score < 5);
  if (alerts.length > 0) {
    lines.push("");
    lines.push(`:rotating_light: *${alerts.length} meeting${alerts.length !== 1 ? "s" : ""} need attention* (score < 5)`);
  }

  const churnSignals = meetings.filter((m) => {
    const ms = m.meeting_score;
    if (!ms) return false;
    const signals = ms.churn_risk_signals as unknown[];
    return Array.isArray(signals) && signals.length > 0;
  });
  if (churnSignals.length > 0) {
    lines.push("");
    lines.push(`:warning: *Churn risk detected in ${churnSignals.length} meeting${churnSignals.length !== 1 ? "s" : ""}:*`);
    for (const m of churnSignals.slice(0, 3)) {
      lines.push(`  - <${DASHBOARD_URL}/meetings/${m.id}|${m.company_name || m.topic}>`);
    }
  }

  return { title, body: lines.join("\n") };
}

function buildFridayReview(section: string, meetings: ScoredMeeting[], dateStr: string) {
  const title = `${section} - Week in Review (${dateStr})`;

  const totalMinutes = meetings.reduce((sum, m) => sum + (m.duration_minutes ?? 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const avgScore = meetings.length > 0
    ? (meetings.reduce((sum, m) => sum + (m.overall_score ?? 0), 0) / meetings.length).toFixed(1)
    : "N/A";

  const lines: string[] = [
    `:bar_chart: *Weekly Investment Summary*`,
    `${meetings.length} meetings | ${totalHours}h invested | Avg Score: ${avgScore}`,
    "",
  ];

  const repScores: Record<string, { total: number; count: number; minutes: number; high: number; low: number }> = {};
  for (const m of meetings) {
    if (!m.host_name || m.overall_score == null) continue;
    if (!repScores[m.host_name]) repScores[m.host_name] = { total: 0, count: 0, minutes: 0, high: 0, low: 0 };
    repScores[m.host_name].total += m.overall_score;
    repScores[m.host_name].count += 1;
    repScores[m.host_name].minutes += m.duration_minutes ?? 0;
    if (m.overall_score >= 8) repScores[m.host_name].high += 1;
    if (m.overall_score < 5) repScores[m.host_name].low += 1;
  }

  const repRanking = Object.entries(repScores)
    .map(([name, s]) => ({ name, avg: s.total / s.count, count: s.count, hours: (s.minutes / 60).toFixed(1), high: s.high, low: s.low }))
    .sort((a, b) => b.avg - a.avg);

  if (repRanking.length > 0) {
    lines.push(`*Rep Performance:*`);
    for (const r of repRanking.slice(0, 5)) {
      const medal = repRanking.indexOf(r) === 0 ? ":first_place_medal: " : "  ";
      const quality = [];
      if (r.high > 0) quality.push(`${r.high} high-quality`);
      if (r.low > 0) quality.push(`${r.low} needs work`);
      const qualityStr = quality.length > 0 ? ` | ${quality.join(", ")}` : "";
      lines.push(`${medal}${r.name}: ${r.count} meetings (${r.hours}h) | Avg ${r.avg.toFixed(1)}${qualityStr}`);
    }
    lines.push("");
  }

  const healthMeetings = meetings.filter((m) => m.client_health_score != null && m.company_name);
  const companyHealth = new Map<string, number[]>();
  for (const m of healthMeetings) {
    const name = m.company_name!;
    if (!companyHealth.has(name)) companyHealth.set(name, []);
    companyHealth.get(name)!.push(m.client_health_score!);
  }

  const healthChanges: { name: string; current: number; trend: string }[] = [];
  for (const [name, scores] of companyHealth) {
    if (scores.length >= 1) {
      const current = scores[0];
      healthChanges.push({ name, current, trend: current >= 7 ? "strong" : current < 5 ? "at-risk" : "monitor" });
    }
  }

  const atRiskCompanies = healthChanges.filter((h) => h.trend === "at-risk");
  const strongCompanies = healthChanges.filter((h) => h.trend === "strong");

  if (atRiskCompanies.length > 0 || strongCompanies.length > 0) {
    lines.push(`:heartbeat: *Account Health:*`);
    for (const c of strongCompanies.slice(0, 3)) {
      lines.push(`  :large_green_circle: ${c.name}: ${c.current}`);
    }
    for (const c of atRiskCompanies.slice(0, 3)) {
      lines.push(`  :red_circle: ${c.name}: ${c.current} - needs attention`);
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

  const coachingTip = getCoachingHighlight(meetings);
  if (coachingTip) {
    lines.push("");
    lines.push(`:bulb: *Coaching Insight:* ${coachingTip}`);
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
      { type: "mrkdwn", text: `_Prism_ | <${DASHBOARD_URL}|Open Dashboard>` },
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
