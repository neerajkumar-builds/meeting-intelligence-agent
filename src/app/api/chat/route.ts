import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RAG_SYSTEM_PROMPT = `You are FullFunnel's Meeting Intelligence assistant. You help the team search and analyze scored meeting data.

You have access to:
1. Meeting score data (numeric scores, stage types, dates, reps, companies)
2. Meeting transcript excerpts (semantic search results from actual call recordings)
3. Coaching intelligence (strengths, blind spots, coaching recommendations, deal progression)
4. Structured action items, decisions, and client references from internal meetings
5. ICP fit analysis, engagement scores, delivery status from scored meetings

When answering:
- Be specific and cite the meeting source (topic, rep, date, company)
- Include scores when relevant
- Reference coaching insights, action items, or deal sentiment when the question relates to performance or account health
- Format your response with markdown for readability
- Keep answers concise but thorough
- When comparing reps, use actual score data — don't estimate

CRITICAL: Never query or reference legacy tables: documents, n8n_vectors, n8n_chat_histories, zoom_meetings_new.`;

interface ChatRequest {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history } = body;

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Step 1: Embed query and vector search transcript chunks
    const embedding = await embedQuery(message);
    let chunks: { id: string; content: string; metadata?: Record<string, unknown>; similarity: number }[] = [];

    if (embedding) {
      const { data } = await supabase.rpc("match_meeting_chunks", {
        query_embedding: `[${embedding.join(",")}]`,
        match_count: 8,
      });
      chunks = data ?? [];
    }

    // Step 2: Fetch score summary for all meetings
    const { data: meetingScores } = await supabase
      .from("meetings_list")
      .select("*")
      .order("start_time", { ascending: false });

    const scoresSummary = (meetingScores ?? [])
      .map(
        (m: Record<string, unknown>) =>
          `${m.host_name} | ${m.topic} | ${m.scoring_stage_type} | Score: ${m.overall_score} | Health: ${m.client_health_score ?? "N/A"} | ${m.start_time} | Company: ${m.company_name ?? "Internal"}`
      )
      .join("\n");

    // Step 3: Fetch JSONB coaching/intelligence for matched meetings
    const matchedMeetingIds = new Set<string>();
    for (const c of chunks) {
      const mid = (c.metadata as Record<string, unknown>)?.meeting_id;
      if (typeof mid === "string") matchedMeetingIds.add(mid);
    }

    let intelligenceBlock = "";
    if (matchedMeetingIds.size > 0) {
      const { data: fullMeetings } = await supabase
        .from("scored_meetings")
        .select(
          "id, topic, host_name, company_name, scoring_stage_type, start_time, overall_score, rep_score, meeting_score, icp_score, engagement_score, delivery_score, internal_summary, client_health_score"
        )
        .in("id", Array.from(matchedMeetingIds));

      if (fullMeetings) {
        intelligenceBlock = fullMeetings
          .map((m: Record<string, unknown>) => {
            const parts = [`\n### ${m.topic} (${m.host_name}, ${m.start_time})`];

            if (m.rep_score && typeof m.rep_score === "object") {
              const rs = m.rep_score as Record<string, unknown>;
              if (rs.strengths) parts.push(`**Strengths:** ${rs.strengths}`);
              if (rs.areas_for_improvement) parts.push(`**Areas for Improvement:** ${rs.areas_for_improvement}`);
              if (rs.blind_spots) parts.push(`**Blind Spots:** ${rs.blind_spots}`);
              if (rs.coaching_recommendations) parts.push(`**Coaching:** ${rs.coaching_recommendations}`);
              if (rs.deal_progression_assessment) parts.push(`**Deal Progression:** ${rs.deal_progression_assessment}`);
            }

            if (m.meeting_score && typeof m.meeting_score === "object") {
              const ms = m.meeting_score as Record<string, unknown>;
              if (ms.deal_sentiment) parts.push(`**Deal Sentiment:** ${ms.deal_sentiment}`);
              if (ms.next_actionables) parts.push(`**Next Steps:** ${ms.next_actionables}`);
              if (ms.reasoning_summary) parts.push(`**Score Reasoning:** ${ms.reasoning_summary}`);
              if (ms.relationship_health) parts.push(`**Relationship Health:** ${ms.relationship_health}`);
              if (ms.delivery_status) parts.push(`**Delivery Status:** ${ms.delivery_status}`);
            }

            if (m.icp_score && typeof m.icp_score === "object") {
              const is = m.icp_score as Record<string, unknown>;
              if (is.reason_for_score) parts.push(`**ICP Analysis:** ${is.reason_for_score}`);
            }

            if (m.internal_summary && typeof m.internal_summary === "object") {
              const internalSummary = m.internal_summary as Record<string, unknown>;
              const actions = internalSummary.action_items;
              if (Array.isArray(actions) && actions.length > 0) {
                parts.push(`**Action Items:**`);
                for (const a of actions as { action: string; owner: string; priority?: string }[]) {
                  parts.push(`- [${a.owner}] ${a.action} (${a.priority ?? ""})`);
                }
              }
              const decisions = internalSummary.decisions_made;
              if (Array.isArray(decisions) && decisions.length > 0) {
                parts.push(`**Decisions:**`);
                for (const d of decisions as { decision: string }[]) {
                  parts.push(`- ${d.decision}`);
                }
              }
              const refs = internalSummary.client_references;
              if (Array.isArray(refs) && refs.length > 0) {
                parts.push(`**Client References:**`);
                for (const r of refs as { client_name: string; sentiment?: string; context?: string }[]) {
                  parts.push(`- ${r.client_name} (${r.sentiment}): ${r.context ?? ""}`);
                }
              }
            }

            return parts.join("\n");
          })
          .join("\n\n");
      }
    }

    // Step 4: Build transcript context
    const contextBlock = chunks.map((c) => c.content).join("\n---\n");

    // Step 5: Stream response
    const anthropic = new Anthropic();

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-8).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: [
          `## Meeting Score Data (all ${meetingScores?.length ?? 0} scored meetings)\n${scoresSummary}`,
          intelligenceBlock ? `\n## Coaching & Intelligence (matched meetings)\n${intelligenceBlock}` : "",
          `\n## Transcript Excerpts\n${contextBlock || "No transcript matches found."}`,
          `\n---\nUser question: ${message}`,
        ].join("\n"),
      },
    ];

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: RAG_SYSTEM_PROMPT,
      messages,
    });

    return new Response(stream.toReadableStream(), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function embedQuery(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text }] },
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.embedding?.values ?? null;
  } catch {
    return null;
  }
}
