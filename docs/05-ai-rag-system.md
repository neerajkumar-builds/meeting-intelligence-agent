# 05 -- AI & RAG System (Ask Blarney)

The Ask Blarney feature is the dashboard's conversational AI interface. It lets FullFunnel team members ask natural-language questions about meeting data, coaching insights, transcripts, and account health. The system uses Retrieval-Augmented Generation (RAG) to ground Claude's answers in real meeting data stored in Supabase.

All source code lives in `src/app/api/chat/route.ts`.

---

## Architecture Overview

```
User Query
    |
    v
Rate Limit Check (daily + burst, against chat_analytics table)
    |
    v
Gemini Embed (gemini-embedding-001 → number[] vector)
    |
    v
Parallel Fetch:
    +-- Vector Search (pgvector via match_meeting_chunks RPC)
    +-- Score Fetch (all rows from meetings_list view)
    |
    v
Filter low-similarity chunks (threshold: 0.3)
    |
    v
Fetch JSONB coaching/intelligence for matched meetings (scored_meetings table)
    |
    v
Context Assembly (3 layers: scores + coaching + transcript excerpts)
    |
    v
Claude Sonnet 4 Stream (claude-sonnet-4-20250514, max_tokens: 4096)
    |
    v
Analytics Logging (fire-and-forget insert to chat_analytics)
    |
    v
ReadableStream response to client
```

---

## System Prompt

The full system prompt is defined as `RAG_SYSTEM_PROMPT` at `src/app/api/chat/route.ts:7-58`. Here it is verbatim:

```
You are FullFunnel's Meeting Intelligence assistant. You help the team search and analyze scored meeting data.

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

VISUAL CHARTS — When the question involves comparing data, include a JSON chart block. The frontend renders these as interactive charts. Format exactly as:

```chart
{"type":"bar","title":"Title","data":[{"label":"Name","value":7.2}]}
```

Chart types and when to use them:
- "bar" — comparing values across categories (rep scores, meeting counts by type). Use for: "compare reps", "show scores by stage", "which rep has the most meetings"
- "donut" — showing proportions/distribution (stage breakdown, status split). Use for: "show meeting types", "what percentage are internal", "breakdown of stages"
- "line" — showing trends over time (score progression, meeting volume by week). Use for: "how have scores changed", "show trend", "weekly meeting volume". Data format: [{"label":"Week 1","value":6.5},{"label":"Week 2","value":7.1}]

Guidelines:
- Always provide real data from the meeting scores — never estimate or make up numbers
- Use "bar" for comparisons (values side by side), "donut" for composition (parts of a whole)
- If the user asks for a specific chart type, use that type
- Include the chart AND a text explanation — don't just return a chart alone
- Only include charts when data visualization adds value — don't force them on transcript searches or coaching questions

SOURCE CITATIONS — At the end of your response, include a sources block listing meetings you referenced. Format exactly as:

```sources
[{"topic":"Meeting Topic","rep":"Rep Name","date":"Apr 3, 2026","company":"Company","id":"actual-uuid-from-data","score":7.3}]
```

CRITICAL: The "id" field MUST be the actual UUID from the meeting data (shown in brackets like [uuid] at the start of each meeting score line). Never use placeholder text like "meeting-uuid". Include 1-5 sources. Only include meetings you actually referenced in your answer.

FOLLOW-UP SUGGESTIONS — After your sources block, suggest 2-3 brief follow-up questions the user might want to ask next, based on your response. Format exactly as:

```followups
["Follow-up question 1?", "Follow-up question 2?", "Follow-up question 3?"]
```

Make them specific and actionable — not generic. If you mentioned a specific rep, suggest digging into their coaching. If you mentioned a risk, suggest exploring it further.

CRITICAL: Never query or reference legacy tables: documents, n8n_vectors, n8n_chat_histories, zoom_meetings_new.
```

### What the Prompt Instructs

1. **Data sources** -- Claude is told it has access to 5 categories of data: numeric scores, transcript excerpts, coaching intelligence, structured action items/decisions/client references, and ICP/engagement/delivery data.

2. **Answer quality rules** -- Cite sources (topic, rep, date, company), include scores, use markdown, stay concise. When comparing reps, use actual data only.

3. **Chart formats** -- Three chart types are supported:
   - `bar` -- for value comparisons across categories
   - `donut` -- for proportional/distribution views
   - `line` -- for trends over time
   
   Charts are embedded as fenced code blocks with language tag `chart` containing a JSON object with `type`, `title`, and `data` array.

4. **Source citations** -- A `sources` fenced block with a JSON array of objects containing `topic`, `rep`, `date`, `company`, `id` (real UUID), and `score`. The UUID comes from the `[uuid]` prefix in the score data lines.

5. **Follow-up suggestions** -- A `followups` fenced block with a JSON array of 2-3 question strings.

6. **Legacy table ban** -- Explicitly blocks Claude from referencing old tables: `documents`, `n8n_vectors`, `n8n_chat_histories`, `zoom_meetings_new`.

---

## Embedding

The `embedQuery()` function at `src/app/api/chat/route.ts:278-301` converts the user's query text into a vector for semantic search.

| Property | Value |
|----------|-------|
| Model | `gemini-embedding-001` |
| Endpoint | `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent` |
| Auth | API key via `GEMINI_API_KEY` env var, passed as `?key=` query param |
| Return type | `number[]` (embedding vector) |
| Fallback | Returns `null` if `GEMINI_API_KEY` is missing or if the API call fails |

When `embedQuery()` returns `null`, vector search is skipped entirely and the chunks array is empty. The system still works -- it just answers from the score data alone, without transcript context.

### Embedding Request Body

```json
{
  "model": "models/gemini-embedding-001",
  "content": {
    "parts": [{ "text": "user's query text" }]
  }
}
```

### Embedding Response Parsing

```typescript
const data = await response.json();
return data.embedding?.values ?? null;
```

---

## Vector Search

Vector search uses a Supabase RPC function backed by pgvector.

| Property | Value |
|----------|-------|
| RPC function | `match_meeting_chunks` |
| Parameters | `query_embedding` (stringified vector), `match_count` (int) |
| Similarity threshold | 0.3 (applied client-side after RPC returns) |

### Dynamic Chunk Count

The number of chunks requested from pgvector varies based on query type. This logic is at `route.ts:123-125`:

```typescript
const chunkCount = /compare|all reps|across|every|breakdown|overview/i.test(message) ? 15
  : message.split(/\s+/).length > 30 ? 12
  : 8;
```

| Query Pattern | Chunk Count | Rationale |
|---------------|-------------|-----------|
| Contains `compare`, `all reps`, `across`, `every`, `breakdown`, or `overview` | 15 | Broad queries need more context across meetings |
| More than 30 words | 12 | Long/complex queries benefit from extra context |
| All other queries | 8 | Focused questions need less but higher-relevance context |

### Client-Side Filtering

After the RPC returns, low-similarity results are filtered out:

```typescript
return (data ?? []).filter((c: Chunk) => c.similarity > 0.3);
```

Each chunk has the shape:

```typescript
type Chunk = {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  similarity: number;
};
```

The `metadata` field contains `meeting_id` which is used to fetch full coaching intelligence for matched meetings.

---

## Context Assembly (3 Layers)

The final prompt sent to Claude contains three sections of context, assembled at `route.ts:231-245`.

### Layer 1: Meeting Score Data

All meetings from the `meetings_list` view, fetched in parallel with vector search. Each meeting is formatted as:

```
[uuid] rep_name | topic | scoring_stage_type | Score: X | Health: Y | date | Company: Z
```

The `[uuid]` prefix is critical -- Claude uses these real UUIDs when generating source citation blocks. The score summary line is built at `route.ts:143-148`:

```typescript
const scoresSummary = (meetingScores ?? [])
  .map(
    (m: Record<string, unknown>) =>
      `[${m.id}] ${m.host_name} | ${m.topic} | ${m.scoring_stage_type} | Score: ${m.overall_score} | Health: ${m.client_health_score ?? "N/A"} | ${m.start_time} | Company: ${m.company_name ?? "Internal"}`
  )
  .join("\n");
```

### Layer 2: Coaching & Intelligence

Only fetched for meetings that appear in the vector search results. The code extracts `meeting_id` from each chunk's metadata, then queries `scored_meetings` for those specific IDs.

Fields pulled from `scored_meetings`:

| Column | Type | Content |
|--------|------|---------|
| `rep_score` | JSONB | `strengths`, `areas_for_improvement`, `blind_spots`, `coaching_recommendations`, `deal_progression_assessment` |
| `meeting_score` | JSONB | `deal_sentiment`, `next_actionables`, `reasoning_summary`, `relationship_health`, `delivery_status` |
| `icp_score` | JSONB | `reason_for_score` |
| `engagement_score` | JSONB | (queried but used via `meeting_score`) |
| `delivery_score` | JSONB | (queried but used via `meeting_score`) |
| `internal_summary` | JSONB | `action_items[]` (action, owner, priority), `decisions_made[]` (decision), `client_references[]` (client_name, sentiment, context) |

Each matched meeting is formatted as a markdown section with headers and bold labels, like:

```
### Meeting Topic (Rep Name, 2026-03-28)
**Strengths:** ...
**Areas for Improvement:** ...
**Blind Spots:** ...
**Coaching:** ...
**Deal Progression:** ...
**Deal Sentiment:** ...
**Next Steps:** ...
**Score Reasoning:** ...
**Relationship Health:** ...
**Delivery Status:** ...
**ICP Analysis:** ...
**Action Items:**
- [Owner] Action description (priority)
**Decisions:**
- Decision description
**Client References:**
- Client Name (sentiment): context
```

### Layer 3: Transcript Excerpts

The raw `content` field of each matched chunk, joined with `---` separators:

```typescript
const contextBlock = chunks.map((c) => c.content).join("\n---\n");
```

If no chunks matched (embedding failed or no results above threshold), this section reads "No transcript matches found."

### Final Message Structure

The user message sent to Claude combines all three layers plus the actual user question:

```
## Meeting Score Data (all N scored meetings)
[score lines...]

## Coaching & Intelligence (matched meetings)
[intelligence blocks...]

## Transcript Excerpts
[chunk text separated by ---]

---
User question: [actual user query]
```

---

## Claude Configuration

| Property | Value |
|----------|-------|
| Model | `claude-sonnet-4-20250514` |
| Max tokens | 4096 |
| System prompt | `RAG_SYSTEM_PROMPT` (see above) |
| Conversation history | Last 16 turns from `history` array |
| Streaming | `anthropic.messages.stream()` with `toReadableStream()` |
| SDK | `@anthropic-ai/sdk` (official Node SDK) |

### Conversation History

The last 16 messages from the client-provided `history` array are prepended to the context message. This gives Claude conversational memory within a session:

```typescript
const messages: Anthropic.MessageParam[] = [
  ...history.slice(-16).map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  })),
  {
    role: "user",
    content: [/* context layers + user question */].join("\n"),
  },
];
```

### Response Streaming

The stream is returned directly to the client as a `ReadableStream`:

```typescript
const stream = anthropic.messages.stream({ model, max_tokens, system, messages });

return new Response(stream.toReadableStream(), {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  },
});
```

The client (`src/components/search/chat-interface.tsx`) reads this as newline-delimited JSON. Each line is a complete JSON object (no SSE `data:` prefix). The client looks for `content_block_delta` events to extract streamed text.

---

## Rate Limiting

Two independent rate limits protect the API. Both are checked at `route.ts:83-117`.

### Daily Limit

| Property | Value |
|----------|-------|
| Default | 50 queries per user per day |
| Env var | `DAILY_QUERY_LIMIT` |
| Reset | Midnight UTC (filters by `created_at >= today`) |
| HTTP status | 429 |
| Response body | `{ error: "Daily limit reached (50 queries). Resets at midnight.", limitReached: true, dailyCount: N }` |

### Burst Limit

| Property | Value |
|----------|-------|
| Default | 10 queries per 5 minutes per user |
| Env var | `BURST_QUERY_LIMIT` |
| Window | Rolling 5-minute window |
| HTTP status | 429 |
| Response body | `{ error: "Too many queries in a short time. Try again in a few minutes.", burstLimited: true }` |

### Implementation Details

- Both limits query the `chat_analytics` table, counting rows where `event_type = 'query'` and `user_email` matches
- Rate limiting only applies when `userEmail` is provided in the request
- **Fail-open behavior**: If the rate limit check throws an error (table doesn't exist, DB timeout, etc.), the query proceeds. This is intentional -- the try/catch at `route.ts:114` silently swallows errors

```typescript
try {
  // ... rate limit checks ...
} catch {
  // Rate limit check failed — allow the query (fail open)
}
```

---

## Analytics

### Server-Side (Query Logging)

Every query is logged to the `chat_analytics` table as fire-and-forget at `route.ts:255-263`:

```typescript
supabase.from("chat_analytics").insert({
  session_id: sessionId ?? "unknown",
  user_email: userEmail ?? null,
  event_type: "query",
  query: message,
  chunks_retrieved: chunks.length,
  sources_count: matchedMeetingIds?.size ?? 0,
  latency_ms: Date.now() - startTime,
}).then(() => {}, () => {});
```

The `.then(() => {}, () => {})` pattern ensures the promise is handled but never blocks the response stream. `startTime` is captured at the top of the handler.

### Client-Side (Event Logging)

The `logChatEvent()` function in `src/lib/analytics.ts` sends interaction events to `POST /api/analytics/chat`:

```typescript
export function logChatEvent(event: {
  sessionId: string;
  eventType: string;
  userEmail?: string;
  query?: string;
  responseLength?: number;
  sourcesCount?: number;
  chunksRetrieved?: number;
  hadChart?: boolean;
  latencyMs?: number;
  errorMessage?: string;
}) {
  fetch("/api/analytics/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {});
}
```

Event types tracked client-side:

| Event Type | When Fired |
|------------|------------|
| `copy` | User copies a response |
| `email_share` | User shares via email |
| `thumbs_up` | User gives positive feedback |
| `thumbs_down` | User gives negative feedback |
| `clear` | User clears chat history |
| `followup_click` | User clicks a suggested follow-up |
| `chart_download` | User downloads a chart image |

All client logging is fire-and-forget with `.catch(() => {})` -- it never blocks the UX.

---

## Tuning Guide

### Getting More Context

| What to Change | Where | Effect |
|----------------|-------|--------|
| Increase `match_count` | `route.ts:123-125` (chunkCount logic) | More chunks returned from pgvector |
| Lower similarity threshold | `route.ts:138` (currently 0.3) | Includes less-relevant chunks |
| Adjust regex patterns | `route.ts:123` | Changes which queries get the "broad" (15) chunk count |

### Getting Longer Answers

| What to Change | Where | Effect |
|----------------|-------|--------|
| Increase `max_tokens` | `route.ts:249` (currently 4096) | Allows Claude to generate longer responses |

### Changing AI Behavior

| What to Change | Where | Effect |
|----------------|-------|--------|
| Modify `RAG_SYSTEM_PROMPT` | `route.ts:7-58` | Changes how Claude interprets data and formats responses |
| Add new chart types | Chart guidelines section of the prompt (~line 24-40) | Frontend must also be updated to render new types |
| Change citation format | Source citations section of the prompt (~line 42-48) | Frontend parser in `chat-interface.tsx` must match |
| Change follow-up format | Follow-up suggestions section (~line 50-56) | Frontend parser must match |

### Changing Rate Limits

| What to Change | Where | Effect |
|----------------|-------|--------|
| `DAILY_QUERY_LIMIT` | Environment variable (default: 50) | Max queries per user per day |
| `BURST_QUERY_LIMIT` | Environment variable (default: 10) | Max queries per user per 5-minute window |

### Switching the Embedding Model

To change from Gemini to another embedding provider:

1. Replace the `embedQuery()` function at `route.ts:278-301`
2. Ensure the returned vector dimensions match what `match_meeting_chunks` expects
3. Re-embed all existing chunks in `meeting_chunks` with the new model (vectors from different models are incompatible)

### Switching the LLM

To change from Claude Sonnet to another model:

1. Update the `model` parameter at `route.ts:248`
2. If switching away from Anthropic entirely, replace the SDK import and streaming logic
3. The system prompt is model-agnostic but the chart/source/followup JSON formats are tested against Claude

---

## Database Dependencies

| Table/View | Used For |
|------------|----------|
| `meetings_list` | Layer 1 score data (all meetings) |
| `scored_meetings` | Layer 2 coaching intelligence (matched meetings only) |
| `meeting_chunks` | Vector search via `match_meeting_chunks` RPC |
| `chat_analytics` | Rate limiting checks and query logging |

---

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `ANTHROPIC_API_KEY` | Yes | -- | Authenticates with Claude API (read automatically by SDK) |
| `GEMINI_API_KEY` | No | -- | Authenticates with Gemini embedding API. If missing, vector search is skipped |
| `DAILY_QUERY_LIMIT` | No | `50` | Max queries per user per calendar day |
| `BURST_QUERY_LIMIT` | No | `10` | Max queries per user per 5-minute window |

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Missing `message` in request body | 400: `"Message is required"` |
| Daily rate limit exceeded | 429: includes `limitReached: true` and `dailyCount` |
| Burst rate limit exceeded | 429: includes `burstLimited: true` |
| Rate limit DB check fails | Fail-open: query proceeds normally |
| Gemini embedding fails | Vector search skipped, chunks array empty |
| Supabase RPC fails | Chunks array empty, proceeds with score data only |
| Claude API fails | 500: `"Internal server error"` |
| Analytics insert fails | Silently ignored (fire-and-forget) |
