import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { TRACKED_VENDORS } from "@/lib/constants";
import type {
  CompanyIntelligence,
  HealthPulse,
  Stakeholder,
  DealStatus,
  RiskSignals,
  RiskSignalItem,
  ActionItem,
  CompetitorMention,
  MeddicAnalysis,
  MeddicDimension,
} from "@/types/intelligence";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const companyName = decodeURIComponent(name);
    const supabase = createServerSupabase();

    // Query A: All scored meetings for this company
    const { data: meetings, error: dbError } = await supabase
      .from("scored_meetings")
      .select(
        "id, topic, host_name, start_time, scoring_stage_type, participant_names, primary_participant_name, meeting_score, engagement_score, internal_summary, client_health_score, overall_score, icp_score, rep_score"
      )
      .eq("company_name", companyName)
      .not("scoring_stage_type", "in", "(internal,internal_client_meeting)")
      .order("start_time", { ascending: false });

    if (dbError) {
      return Response.json({ error: dbError.message }, { status: 500 });
    }

    const allMeetings = meetings ?? [];

    // Query B: Competitor keyword search (parallel)
    const competitorMentions = await searchCompetitors(supabase, companyName);

    // Build all 7 sections
    const intelligence: CompanyIntelligence = {
      companyName,
      generatedAt: new Date().toISOString(),
      healthPulse: buildHealthPulse(allMeetings),
      stakeholders: buildStakeholders(allMeetings),
      dealStatus: buildDealStatus(allMeetings),
      riskSignals: buildRiskSignals(allMeetings),
      openActionItems: buildActionItems(allMeetings),
      competitorMentions,
      meddicGaps: buildMeddicAnalysis(allMeetings),
    };

    return Response.json(intelligence);
  } catch (error) {
    console.error("Intelligence API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Section Builders ──

type MeetingRow = Record<string, unknown>;

function buildHealthPulse(meetings: MeetingRow[]): HealthPulse {
  const withHealth = meetings
    .filter((m) => m.client_health_score !== null && m.start_time)
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));

  if (withHealth.length === 0) {
    return { currentScore: null, previousScore: null, trend: "insufficient_data", dataPoints: [] };
  }

  const dataPoints = withHealth.map((m) => ({
    date: String(m.start_time),
    score: m.client_health_score as number,
  }));

  const current = dataPoints[dataPoints.length - 1].score;
  const previous = dataPoints.length >= 2 ? dataPoints[dataPoints.length - 2].score : null;

  let trend: HealthPulse["trend"] = "insufficient_data";
  if (previous !== null) {
    const delta = current - previous;
    trend = delta > 0.5 ? "improving" : delta < -0.5 ? "declining" : "stable";
  }

  return { currentScore: current, previousScore: previous, trend, dataPoints };
}

function buildStakeholders(meetings: MeetingRow[]): Stakeholder[] {
  // Use normalized key (lowercase, no spaces) to dedup variants like "SounakBanerji" vs "Sounak Banerji"
  const people = new Map<string, { displayName: string; role: "participant" | "host"; count: number; first: string; last: string }>();

  function normalizeKey(name: string): string {
    return name.toLowerCase().replace(/\s+/g, "");
  }

  function trackPerson(name: string, startTime: string) {
    if (!name) return;
    const key = normalizeKey(name);
    const existing = people.get(key) ?? { displayName: name, role: "participant" as const, count: 0, first: startTime, last: startTime };
    existing.count++;
    // Prefer the version with spaces as display name
    if (name.includes(" ") && !existing.displayName.includes(" ")) {
      existing.displayName = name;
    }
    if (startTime < existing.first) existing.first = startTime;
    if (startTime > existing.last) existing.last = startTime;
    people.set(key, existing);
  }

  for (const m of meetings) {
    const startTime = String(m.start_time ?? "");
    const hostKey = m.host_name ? normalizeKey(String(m.host_name)) : "";

    // Track participants
    const participants = m.participant_names as string[] | null;
    if (Array.isArray(participants)) {
      for (const name of participants) {
        if (!name || normalizeKey(name) === hostKey) continue;
        trackPerson(name, startTime);
      }
    }

    // Track primary participant
    const primary = m.primary_participant_name as string | null;
    if (primary && normalizeKey(primary) !== hostKey) {
      trackPerson(primary, startTime);
    }
  }

  return Array.from(people.values())
    .map((data) => ({
      name: data.displayName,
      role: data.role,
      meetingCount: data.count,
      lastSeenDate: data.last,
      firstSeenDate: data.first,
    }))
    .sort((a, b) => b.meetingCount - a.meetingCount)
    .slice(0, 10);
}

function buildDealStatus(meetings: MeetingRow[]): DealStatus | null {
  const discovery = meetings.find((m) => m.scoring_stage_type === "discovery_scoping" && m.meeting_score);
  if (!discovery) return null;

  const ms = discovery.meeting_score as Record<string, unknown>;
  return {
    latestSentiment: (ms.deal_sentiment as string) ?? null,
    tentativeClosureDate: (ms.tentative_closure_date as string) ?? null,
    latestLeadScore: (ms.lead_score as number) ?? null,
    nextActionables: (ms.next_actionables as string) ?? null,
    fromMeetingTopic: String(discovery.topic ?? ""),
    fromMeetingDate: String(discovery.start_time ?? ""),
  };
}

function buildRiskSignals(meetings: MeetingRow[]): RiskSignals {
  const churnSignals: RiskSignalItem[] = [];
  const expansionSignals: RiskSignalItem[] = [];

  for (const m of meetings) {
    if (m.scoring_stage_type !== "follow_up") continue;
    const score = (m.meeting_score ?? m.engagement_score) as Record<string, unknown> | null;
    if (!score) continue;

    const churn = score.churn_risk_signals as string[] | null;
    if (Array.isArray(churn)) {
      for (const signal of churn) {
        churnSignals.push({
          signal,
          meetingTopic: String(m.topic ?? ""),
          meetingDate: String(m.start_time ?? ""),
          meetingId: String(m.id),
        });
      }
    }

    const expansion = score.expansion_signals as string[] | null;
    if (Array.isArray(expansion)) {
      for (const signal of expansion) {
        expansionSignals.push({
          signal,
          meetingTopic: String(m.topic ?? ""),
          meetingDate: String(m.start_time ?? ""),
          meetingId: String(m.id),
        });
      }
    }
  }

  return { churnSignals: churnSignals.slice(0, 8), expansionSignals: expansionSignals.slice(0, 8) };
}

function buildActionItems(meetings: MeetingRow[]): ActionItem[] {
  const items: ActionItem[] = [];

  for (const m of meetings) {
    const summary = m.internal_summary as Record<string, unknown> | null;
    if (!summary) continue;

    const actions = summary.action_items as Array<{
      action: string;
      owner: string;
      deadline?: string;
      priority?: string;
      context?: string;
    }> | null;

    if (!Array.isArray(actions)) continue;

    for (const a of actions) {
      items.push({
        action: a.action,
        owner: a.owner ?? "Unassigned",
        deadline: a.deadline ?? null,
        priority: (a.priority as ActionItem["priority"]) ?? null,
        context: a.context ?? null,
        fromMeetingTopic: String(m.topic ?? ""),
        fromMeetingDate: String(m.start_time ?? ""),
        meetingId: String(m.id),
      });
    }
  }

  // Sort: high priority first, then by date
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => {
    const pa = priorityOrder[a.priority ?? "low"] ?? 3;
    const pb = priorityOrder[b.priority ?? "low"] ?? 3;
    if (pa !== pb) return pa - pb;
    return b.fromMeetingDate.localeCompare(a.fromMeetingDate);
  });

  return items.slice(0, 10);
}

async function searchCompetitors(
  supabase: ReturnType<typeof createServerSupabase>,
  companyName: string
): Promise<CompetitorMention[]> {
  const vendorMap = new Map<string, CompetitorMention>();

  // Run all vendor searches in parallel
  const results = await Promise.all(
    TRACKED_VENDORS.map(async (term) => {
      const { data } = await supabase
        .from("meeting_chunks")
        .select("id, meeting_id, chunk_text, metadata")
        .ilike("chunk_text", `%${term}%`)
        .limit(5);
      return { term, data: data ?? [] };
    })
  );

  for (const { term, data } of results) {
    for (const chunk of data) {
      const meta = chunk.metadata as Record<string, unknown> | null;
      if ((meta?.company_name as string) !== companyName) continue;

      const text = chunk.chunk_text as string;
      const idx = text.toLowerCase().indexOf(term.toLowerCase());
      if (idx === -1) continue;

      const start = Math.max(0, idx - 40);
      const end = Math.min(text.length, idx + term.length + 40);
      const snippet = (start > 0 ? "..." : "") + text.slice(start, end).trim() + (end < text.length ? "..." : "");

      const existing = vendorMap.get(term) ?? { vendor: term, count: 0, meetings: [] };
      existing.count++;
      existing.meetings.push({
        meetingId: (meta?.meeting_id as string) ?? chunk.meeting_id,
        topic: (meta?.topic as string) ?? "Unknown",
        date: (meta?.start_time as string) ?? "",
        snippet,
      });
      vendorMap.set(term, existing);
    }
  }

  return Array.from(vendorMap.values())
    .filter((v) => v.count > 0)
    .sort((a, b) => b.count - a.count);
}

function buildMeddicAnalysis(meetings: MeetingRow[]): MeddicAnalysis {
  const dimensions: MeddicDimension[] = [
    { key: "metrics", label: "Metrics", status: "missing", evidence: null, sourceMeetingId: null, sourceMeetingTopic: null },
    { key: "economic_buyer", label: "Economic Buyer", status: "missing", evidence: null, sourceMeetingId: null, sourceMeetingTopic: null },
    { key: "decision_criteria", label: "Decision Criteria", status: "missing", evidence: null, sourceMeetingId: null, sourceMeetingTopic: null },
    { key: "decision_process", label: "Decision Process", status: "missing", evidence: null, sourceMeetingId: null, sourceMeetingTopic: null },
    { key: "identify_pain", label: "Identify Pain", status: "missing", evidence: null, sourceMeetingId: null, sourceMeetingTopic: null },
    { key: "champion", label: "Champion", status: "missing", evidence: null, sourceMeetingId: null, sourceMeetingTopic: null },
  ];

  const discovery = meetings.filter((m) => m.scoring_stage_type === "discovery_scoping");

  for (const m of discovery) {
    const ms = m.meeting_score as Record<string, unknown> | null;
    const icp = m.icp_score as Record<string, unknown> | null;
    const meetingId = String(m.id);
    const meetingTopic = String(m.topic ?? "");

    // Metrics: lead_score + reasoning mentioning numbers/ROI
    if (ms?.lead_score) {
      const dim = dimensions.find((d) => d.key === "metrics")!;
      const reasoning = String(ms.reasoning_summary ?? "");
      dim.status = reasoning.match(/roi|revenue|metric|number|budget|\$|cost/i) ? "known" : "partial";
      dim.evidence = `Lead score: ${ms.lead_score}`;
      dim.sourceMeetingId = meetingId;
      dim.sourceMeetingTopic = meetingTopic;
    }

    // Economic Buyer: look for senior titles in participants
    const participants = m.participant_names as string[] | null;
    if (Array.isArray(participants)) {
      const seniorPattern = /\b(vp|director|chief|head of|ceo|cfo|cto|coo|svp|evp)\b/i;
      const senior = participants.find((p) => seniorPattern.test(p));
      if (senior) {
        const dim = dimensions.find((d) => d.key === "economic_buyer")!;
        dim.status = "known";
        dim.evidence = senior;
        dim.sourceMeetingId = meetingId;
        dim.sourceMeetingTopic = meetingTopic;
      }
    }

    // Decision Criteria: deal_sentiment + reasoning about criteria
    if (ms?.deal_sentiment) {
      const dim = dimensions.find((d) => d.key === "decision_criteria")!;
      if (dim.status === "missing") {
        dim.status = "partial";
        dim.evidence = String(ms.deal_sentiment);
        dim.sourceMeetingId = meetingId;
        dim.sourceMeetingTopic = meetingTopic;
      }
    }

    // Decision Process: tentative_closure_date or next_actionables
    if (ms?.tentative_closure_date || ms?.next_actionables) {
      const dim = dimensions.find((d) => d.key === "decision_process")!;
      dim.status = ms.tentative_closure_date ? "known" : "partial";
      dim.evidence = ms.tentative_closure_date
        ? `Closure: ${ms.tentative_closure_date}`
        : String(ms.next_actionables ?? "").slice(0, 80);
      dim.sourceMeetingId = meetingId;
      dim.sourceMeetingTopic = meetingTopic;
    }

    // Identify Pain: ICP alignment signals + reason
    if (icp?.icp_alignment_signals || icp?.reason_for_score) {
      const dim = dimensions.find((d) => d.key === "identify_pain")!;
      const signals = icp.icp_alignment_signals as string[] | null;
      dim.status = (signals && signals.length > 0) ? "known" : "partial";
      dim.evidence = signals ? signals.slice(0, 2).join("; ") : String(icp.reason_for_score ?? "").slice(0, 80);
      dim.sourceMeetingId = meetingId;
      dim.sourceMeetingTopic = meetingTopic;
    }
  }

  // Champion: primary_participant appears in 3+ meetings
  const contactCounts = new Map<string, number>();
  for (const m of meetings) {
    const primary = m.primary_participant_name as string | null;
    if (primary) contactCounts.set(primary, (contactCounts.get(primary) ?? 0) + 1);
  }
  for (const [name, count] of contactCounts) {
    if (count >= 3) {
      const dim = dimensions.find((d) => d.key === "champion")!;
      dim.status = "known";
      dim.evidence = `${name} (${count} meetings)`;
      break;
    } else if (count >= 2) {
      const dim = dimensions.find((d) => d.key === "champion")!;
      if (dim.status === "missing") {
        dim.status = "partial";
        dim.evidence = `${name} (${count} meetings)`;
      }
    }
  }

  const knownCount = dimensions.filter((d) => d.status === "known").length;
  const partialCount = dimensions.filter((d) => d.status === "partial").length;
  const overallCoverage = Math.round(((knownCount + partialCount * 0.5) / 6) * 100);

  return { dimensions, overallCoverage };
}
