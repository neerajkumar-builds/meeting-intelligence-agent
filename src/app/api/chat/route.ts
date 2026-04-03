import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs"; // NOT edge — Anthropic SDK has streaming bugs on Edge

const RAG_SYSTEM_PROMPT = `You are FullFunnel's Meeting Intelligence assistant. You help the team search and analyze scored meeting data.

You have access to meeting transcripts, scores, action items, coaching insights, and company data from FullFunnel's Zoom meetings.

When answering:
- Be specific and cite the meeting source (topic, rep, date, company)
- Include scores when relevant
- If the context doesn't contain enough information to answer, say so
- Format your response with markdown for readability
- Keep answers concise but thorough

CRITICAL: Never query or reference these legacy tables: documents, n8n_vectors, n8n_chat_histories, zoom_meetings_new.
The ONLY valid data sources are: scored_meetings, meeting_chunks, scoring_run_log, zoom_users.`;

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

    // Step 1: Embed the query using Gemini API
    const embedding = await embedQuery(message);
    if (!embedding) {
      return Response.json(
        { error: "Failed to generate embedding" },
        { status: 500 }
      );
    }

    // Step 2: Search Supabase via RPC
    const supabase = createServerSupabase();
    const { data: chunks, error: searchError } = await supabase.rpc(
      "match_meeting_chunks",
      {
        query_embedding: `[${embedding.join(",")}]`,
        match_count: 8,
      }
    );

    if (searchError) {
      console.error("Vector search error:", searchError);
      return Response.json(
        { error: "Vector search failed" },
        { status: 500 }
      );
    }

    // Step 3: Build context from retrieved chunks
    // Each chunk's `content` field already includes a header line with meeting metadata
    const contextBlock = (chunks ?? [])
      .map(
        (c: {
          id: string;
          content: string;
          metadata?: Record<string, unknown>;
          similarity: number;
        }) => c.content
      )
      .join("\n---\n");

    // Step 4: Stream response via Anthropic SDK
    const anthropic = new Anthropic();

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-8).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: contextBlock
          ? `Context from meeting transcripts:\n${contextBlock}\n\n---\nUser question: ${message}`
          : `No relevant meeting transcripts found for this query.\n\nUser question: ${message}`,
      },
    ];

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: RAG_SYSTEM_PROMPT,
      messages,
    });

    // Return streaming response
    const readableStream = stream.toReadableStream();

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function embedQuery(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not configured");
    return null;
  }

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

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.embedding?.values ?? null;
  } catch (error) {
    console.error("Gemini embedding error:", error);
    return null;
  }
}
