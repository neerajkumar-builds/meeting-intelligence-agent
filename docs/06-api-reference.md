# 06 -- API Reference

All API routes are Next.js App Router route handlers under `src/app/api/`. Every route uses the edge-compatible `NextRequest`/`Response` pattern. Routes that call Claude use the `@anthropic-ai/sdk` package. Routes that access the database use `createServerSupabase()` from `src/lib/supabase/server.ts`.

---

## Table of Contents

1. [POST /api/chat](#1-post-apichat) -- RAG streaming chat
2. [POST /api/analytics/chat](#2-post-apianalyticschat) -- Analytics event logging
3. [POST /api/actions/draft-email](#3-post-apiactionsdraft-email) -- Email template generation
4. [POST /api/actions/meeting-prep](#4-post-apiactionsmeeting-prep) -- Pre-call briefing
5. [POST /api/actions/resummarize](#5-post-apiactionsresummarize) -- Meeting re-summarization
6. [GET /api/companies/[name]/intelligence](#6-get-apicompaniesnameintelligence) -- Company intelligence aggregation
7. [GET /api/meetings/[id]/notes](#7-get-apimeetingsidnotes) -- Fetch meeting notes
8. [POST /api/meetings/[id]/notes](#8-post-apimeetingsidnotes) -- Create meeting note
9. [POST /api/notifications/slack](#9-post-apinotificationsslack) -- Send Slack message
10. [GET /api/slack/channels](#10-get-apislackchannels) -- List allowed Slack channels

---

## 1. POST /api/chat

RAG-powered streaming chat with Claude. Embeds the user query, runs vector search, assembles context from meeting scores + coaching intelligence + transcript excerpts, and streams a Claude response.

**Source:** `src/app/api/chat/route.ts`

### Request

```typescript
interface ChatRequest {
  message: string;                                         // Required. The user's question.
  history: { role: "user" | "assistant"; content: string }[]; // Conversation history (last 16 turns used).
  sessionId?: string;                                      // Client session ID for analytics.
  userEmail?: string;                                      // User email for rate limiting + analytics.
}
```

**Example:**

```json
{
  "message": "Compare all reps' average meeting scores",
  "history": [
    { "role": "user", "content": "Who had the best score last week?" },
    { "role": "assistant", "content": "Tyler had the highest..." }
  ],
  "sessionId": "abc-123",
  "userEmail": "tyler@fullfunnel.io"
}
```

### Response

**Success (200):** `ReadableStream` with `Content-Type: text/event-stream`

The stream uses Anthropic's `toReadableStream()` format: newline-delimited JSON objects. Each line is a complete JSON object (no SSE `data:` prefix). The client reads `content_block_delta` events to extract streamed text.

The streamed text may contain three special fenced code blocks that the frontend parses:

1. **Chart block** (language: `chart`):
```json
{"type":"bar","title":"Rep Score Comparison","data":[{"label":"Tyler","value":8.1},{"label":"Jake","value":7.4}]}
```

2. **Sources block** (language: `sources`):
```json
[{"topic":"Discovery Call - Acme","rep":"Tyler","date":"Apr 1, 2026","company":"Acme Corp","id":"550e8400-e29b-41d4-a716-446655440000","score":8.1}]
```

3. **Follow-ups block** (language: `followups`):
```json
["What coaching insights exist for Tyler?","How has Tyler's score trended over the last month?"]
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `message` field | `{ "error": "Message is required" }` |
| 429 | Daily limit exceeded | `{ "error": "Daily limit reached (50 queries). Resets at midnight.", "limitReached": true, "dailyCount": 50 }` |
| 429 | Burst limit exceeded | `{ "error": "Too many queries in a short time. Try again in a few minutes.", "burstLimited": true }` |
| 500 | Internal error | `{ "error": "Internal server error" }` |

### Rate Limits

| Limit | Default | Env Var | Window |
|-------|---------|---------|--------|
| Daily | 50 queries/user | `DAILY_QUERY_LIMIT` | Calendar day (UTC) |
| Burst | 10 queries/user | `BURST_QUERY_LIMIT` | Rolling 5-minute window |

Rate limits only apply when `userEmail` is provided. If the rate limit check itself fails (DB error), the query proceeds (fail-open).

### Called By

- `src/components/search/chat-interface.tsx` -- The main Ask Blarney chat interface. Sends the message, conversation history, session ID, and user email. Reads the stream and parses chart/source/followup blocks from the response.

---

## 2. POST /api/analytics/chat

Logs chat interaction events to the `chat_analytics` table. Designed to never fail visibly -- always returns 200.

**Source:** `src/app/api/analytics/chat/route.ts`

### Request

```typescript
interface ChatAnalyticsEvent {
  sessionId: string;         // Client session ID.
  eventType: string;         // Event name (see table below).
  userEmail?: string;        // User email.
  query?: string;            // The user's query text (for "query" events).
  responseLength?: number;   // Character count of Claude's response.
  sourcesCount?: number;     // Number of source citations in response.
  chunksRetrieved?: number;  // Number of vector search chunks used.
  hadChart?: boolean;        // Whether response contained a chart block.
  latencyMs?: number;        // End-to-end latency in milliseconds.
  errorMessage?: string;     // Error message if the query failed.
}
```

**Event types:**

| Event Type | Description | Logged From |
|------------|-------------|-------------|
| `query` | A RAG query was executed | Server-side (route.ts:255) and client-side |
| `copy` | User copied a response | Client-side |
| `email_share` | User shared response via email | Client-side |
| `thumbs_up` | User gave positive feedback | Client-side |
| `thumbs_down` | User gave negative feedback | Client-side |
| `clear` | User cleared chat history | Client-side |
| `followup_click` | User clicked a suggested follow-up | Client-side |
| `chart_download` | User downloaded a chart as image | Client-side |

**Example:**

```json
{
  "sessionId": "abc-123",
  "eventType": "thumbs_up",
  "userEmail": "tyler@fullfunnel.io",
  "query": "Compare all reps",
  "responseLength": 1240,
  "sourcesCount": 3,
  "chunksRetrieved": 8,
  "hadChart": true,
  "latencyMs": 2340
}
```

### Response

**Always 200**, regardless of whether the insert succeeded or failed:

```json
{ "ok": true }
```

The handler wraps the entire insert in a try/catch that silently swallows errors:

```typescript
try {
  await supabase.from("chat_analytics").insert({ ... });
} catch {
  // Silent failure — analytics never blocks
}
```

### Rate Limits

None. This endpoint has no rate limiting.

### Called By

- `src/lib/analytics.ts` -- The `logChatEvent()` helper function. Used throughout `chat-interface.tsx` and related components. All calls are fire-and-forget with `.catch(() => {})`.
- `src/app/api/chat/route.ts` -- Server-side query logging (fire-and-forget).

---

## 3. POST /api/actions/draft-email

Generates a templated email (subject + body) from meeting data using Claude. Supports three templates with distinct system prompts.

**Source:** `src/app/api/actions/draft-email/route.ts`

### Request

```typescript
interface DraftEmailRequest {
  meetingId: string;  // UUID of the meeting.
  template: "client_followup" | "internal_recap" | "executive_briefing";
}
```

**Example:**

```json
{
  "meetingId": "550e8400-e29b-41d4-a716-446655440000",
  "template": "client_followup"
}
```

### Templates

| Template | Label | Max Words | Focus |
|----------|-------|-----------|-------|
| `client_followup` | Client Follow-Up | 300 | Greeting, recap, action items with owners/deadlines, next steps, sign-off |
| `internal_recap` | Internal Recap | 250 | Attendees, key points, scores, action items, risks, next steps |
| `executive_briefing` | Executive Briefing | 3-5 bullets | Deal status, risks, strategic implications, what needs CEO attention |

### Response

**Success (200):**

```json
{
  "subject": "Follow-up: Discovery Call with Acme Corp",
  "body": "Hi Sarah,\n\nGreat speaking with you today about..."
}
```

Claude is instructed to return JSON with `subject` and `body` fields. If JSON parsing fails, the route falls back to:

```json
{
  "subject": "Re: Discovery Call with Acme Corp",
  "body": "raw text from Claude"
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `meetingId` or `template`, or invalid template name | `{ "error": "Invalid request" }` |
| 404 | Meeting not found in `scored_meetings` | `{ "error": "Meeting not found" }` |
| 500 | Claude API error or other internal error | `{ "error": "Failed to generate email" }` |

### Claude Configuration

| Property | Value |
|----------|-------|
| Model | `claude-sonnet-4-20250514` |
| Max tokens | 1024 |
| Transcript limit | First 8,000 characters |

### Data Used

Fetches from `scored_meetings`: `topic`, `host_name`, `company_name`, `primary_participant_name`, `start_time`, `meeting_summary`, `transcript_text`, `meeting_score`, `rep_score`, `internal_summary`, `scoring_stage_type`.

### Rate Limits

None at the API level.

### Called By

- `src/components/meetings/meeting-actions/draft-email-dialog.tsx` -- The email drafting dialog on the meeting detail page. User selects a template, clicks generate, gets a preview with copy/edit options.

---

## 4. POST /api/actions/meeting-prep

Generates a pre-call briefing for an upcoming meeting with a company, based on all previous meetings with that company.

**Source:** `src/app/api/actions/meeting-prep/route.ts`

### Request

```typescript
interface MeetingPrepRequest {
  companyName: string;       // Required. Company to research.
  currentMeetingId: string;  // Optional. Excludes this meeting from the history.
}
```

**Example:**

```json
{
  "companyName": "Acme Corp",
  "currentMeetingId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response

**Success (200):** Returns markdown-formatted prep briefing.

```json
{
  "brief": "## Company: Acme Corp\n**Meetings to date:** 5\n**Relationship health:** Improving\n\n## Key Context\n..."
}
```

If no previous meetings exist with the company:

```json
{
  "brief": "No previous meetings found with Acme Corp. This appears to be the first engagement."
}
```

The prep brief is structured as:

1. **Company header** -- name, meeting count, relationship health trend
2. **Key Context** -- engagement stage, discussion topics, sentiment/health trend
3. **Open Action Items** -- unresolved items with owners from previous meetings
4. **Watch Out For** -- risks, concerns, blind spots from scores
5. **Suggested Talking Points** -- 3-5 specific topics based on prior context

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `companyName` | `{ "error": "Company name required" }` |
| 500 | DB query failed | `{ "error": "Failed to fetch meetings" }` |
| 500 | Claude API error or other internal error | `{ "error": "Failed to generate prep brief" }` |

### Claude Configuration

| Property | Value |
|----------|-------|
| Model | `claude-sonnet-4-20250514` |
| Max tokens | 1500 |
| Meeting limit | Last 10 completed meetings with the company |
| Context truncation | `meeting_score` JSON truncated to 500 chars, `rep_score` to 300 chars per meeting |

### Data Used

Fetches from `scored_meetings` where `company_name` matches and `status = 'completed'`, ordered by `start_time` descending, limited to 10 rows. Excludes `currentMeetingId` if provided.

Fields: `id`, `topic`, `host_name`, `primary_participant_name`, `start_time`, `meeting_summary`, `scoring_stage_type`, `overall_score`, `client_health_score`, `meeting_score`, `rep_score`, `internal_summary`.

### Rate Limits

None at the API level.

### Called By

- `src/components/meetings/meeting-actions/meeting-prep-dialog.tsx` -- The meeting prep dialog on the meeting detail page. Passes the company name and current meeting ID, displays the returned markdown brief.

---

## 5. POST /api/actions/resummarize

Re-summarizes a meeting in one of four structured formats using Claude.

**Source:** `src/app/api/actions/resummarize/route.ts`

### Request

```typescript
interface ResummarizeRequest {
  meetingId: string;  // UUID of the meeting.
  format: "jake_sop" | "executive_summary" | "bullet_points" | "client_mom";
}
```

**Example:**

```json
{
  "meetingId": "550e8400-e29b-41d4-a716-446655440000",
  "format": "jake_sop"
}
```

### Formats

| Format | Label | Description |
|--------|-------|-------------|
| `jake_sop` | Jake SOP Format | Action items split by Client/FullFunnel/Kantata, key discussion points, next steps. Names, dates, deliverables. |
| `executive_summary` | Executive Summary | 3-5 sentence prose. What was discussed, decided, next, and risks. Under 100 words. |
| `bullet_points` | Bullet Points | Concise bullets: topics, decisions, action items (with owners), open questions, next deadline. Max 15 bullets. |
| `client_mom` | Client Minutes of Meeting | Professional MOM with attendees, numbered discussion points, action table (owner, deadline), next meeting. No internal commentary or scores. |

### Format System Prompts (Actual)

**jake_sop:**
```
Re-summarize this meeting in Jake's SOP format:

## Action Items
### Client Actions
- [Action] — Owner: [Name], Deadline: [Date]

### FullFunnel Actions
- [Action] — Owner: [Name], Deadline: [Date]

### Kantata Tasks
- [Task title] — Assignee: [Name]

## Key Discussion Points
[Bullet points]

## Next Steps
[Bullet points]

Be specific with names, dates, and deliverables. Use first names only.
```

**executive_summary:**
```
Write a 3-5 sentence executive summary of this meeting. Focus on: what was discussed, what was decided, what happens next, and any risks. No bullets — flowing prose. Keep it under 100 words.
```

**bullet_points:**
```
Summarize this meeting as concise bullet points:
- Key topics discussed
- Decisions made
- Action items (with owners)
- Open questions
- Next meeting/deadline

Maximum 15 bullets. Each bullet should be one line.
```

**client_mom:**
```
Write professional Minutes of Meeting (MOM) suitable for sharing with the client. Include:

**Meeting:** [Topic]
**Date:** [Date]
**Attendees:** [Names]

**Discussion Points:**
1. [Point]

**Agreed Actions:**
| # | Action | Owner | Deadline |
|---|--------|-------|----------|

**Next Meeting:** [Date/TBD]

Keep it professional, factual, and free of internal FullFunnel commentary or scores.
```

### Response

**Success (200):**

```json
{
  "summary": "## Action Items\n### Client Actions\n- Update the design mockups — Owner: Sarah, Deadline: Apr 10\n..."
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `meetingId` or `format`, or invalid format name | `{ "error": "Invalid request" }` |
| 404 | Meeting not found in `scored_meetings` | `{ "error": "Meeting not found" }` |
| 500 | Claude API error or other internal error | `{ "error": "Failed to generate summary" }` |

### Claude Configuration

| Property | Value |
|----------|-------|
| Model | `claude-sonnet-4-20250514` |
| Max tokens | 1500 |
| Transcript limit | First 10,000 characters |

### Data Used

Fetches from `scored_meetings`: `topic`, `host_name`, `company_name`, `primary_participant_name`, `start_time`, `duration_minutes`, `meeting_summary`, `transcript_text`, `meeting_score`, `rep_score`, `internal_summary`, `scoring_stage_type`.

### Rate Limits

None at the API level.

### Called By

- `src/components/meetings/meeting-actions/resummarize-dialog.tsx` -- The re-summarize dialog on the meeting detail page. User selects a format, clicks generate, gets a preview of the new summary.

---

## 6. GET /api/companies/[name]/intelligence

Aggregates all available intelligence about a company from its meeting history. Returns a structured `CompanyIntelligence` object with 7 sections. All computation is done server-side -- no Claude calls.

**Source:** `src/app/api/companies/[name]/intelligence/route.ts`

### Request

**URL parameter:** `name` -- URL-encoded company name.

```
GET /api/companies/Acme%20Corp/intelligence
```

No request body.

### Response

**Success (200):**

```typescript
interface CompanyIntelligence {
  companyName: string;
  generatedAt: string;            // ISO timestamp

  healthPulse: HealthPulse;
  stakeholders: Stakeholder[];
  dealStatus: DealStatus | null;
  riskSignals: RiskSignals;
  openActionItems: ActionItem[];
  competitorMentions: CompetitorMention[];
  meddicGaps: MeddicAnalysis;
}
```

### Section Details

#### 1. Health Pulse

Tracks `client_health_score` over time to determine trend.

```typescript
interface HealthPulse {
  currentScore: number | null;
  previousScore: number | null;
  trend: "improving" | "declining" | "stable" | "insufficient_data";
  dataPoints: { date: string; score: number }[];
}
```

Trend logic: `delta > 0.5` = improving, `delta < -0.5` = declining, else stable. Requires at least 2 data points.

#### 2. Stakeholders

Deduped list of external participants across all meetings, sorted by meeting count.

```typescript
interface Stakeholder {
  name: string;
  role: "participant" | "host";
  meetingCount: number;
  lastSeenDate: string;
  firstSeenDate: string;
}
```

Max 10 stakeholders returned. Names are deduplicated using a normalized key (lowercase, no spaces) to handle variants like "SounakBanerji" vs "Sounak Banerji". The version with spaces is preferred as display name.

#### 3. Deal Status

Extracted from the most recent `discovery_scoping` meeting's `meeting_score` JSONB.

```typescript
interface DealStatus {
  latestSentiment: string | null;       // meeting_score.deal_sentiment
  tentativeClosureDate: string | null;  // meeting_score.tentative_closure_date
  latestLeadScore: number | null;       // meeting_score.lead_score
  nextActionables: string | null;       // meeting_score.next_actionables
  fromMeetingTopic: string | null;
  fromMeetingDate: string | null;
}
```

Returns `null` if no discovery/scoping meetings exist.

#### 4. Risk Signals

Extracted from `follow_up` meetings' `meeting_score` or `engagement_score` JSONB fields.

```typescript
interface RiskSignals {
  churnSignals: RiskSignalItem[];      // Max 8
  expansionSignals: RiskSignalItem[];  // Max 8
}

interface RiskSignalItem {
  signal: string;
  meetingTopic: string;
  meetingDate: string;
  meetingId: string;
}
```

#### 5. Open Action Items

Extracted from `internal_summary.action_items` JSONB arrays across all meetings.

```typescript
interface ActionItem {
  action: string;
  owner: string;
  deadline: string | null;
  priority: "high" | "medium" | "low" | null;
  context: string | null;
  fromMeetingTopic: string;
  fromMeetingDate: string;
  meetingId: string;
}
```

Max 10 items returned. Sorted by priority (high first), then by date (most recent first).

#### 6. Competitor Mentions

Searches `meeting_chunks` for mentions of tracked vendors in this company's meetings.

```typescript
interface CompetitorMention {
  vendor: string;
  count: number;
  meetings: {
    meetingId: string;
    topic: string;
    date: string;
    snippet: string;   // ~80 chars of context around the mention
  }[];
}
```

The tracked vendor list is defined in `src/lib/constants.ts`:

```typescript
export const TRACKED_VENDORS = [
  "Gong", "Chorus", "Salesloft", "Outreach", "Apollo",
  "6Sense", "6sense", "ZoomInfo", "Clari",
  "Salesforce", "Pardot", "Marketo", "Drift", "Intercom",
  "Definitive Healthcare", "Conversica",
  "Lemlist", "Lavender", "Regie", "Orum",
  "HubSpot", "Clay", "HeyReach", "Instantly",
];
```

Each vendor is searched in parallel using `ilike` (case-insensitive) against `chunk_text`, limited to 5 chunks per vendor. Snippets are extracted as ~80 characters of surrounding context.

#### 7. MEDDIC Gaps

Analyzes discovery/scoping meetings against the MEDDIC sales methodology framework.

```typescript
interface MeddicAnalysis {
  dimensions: MeddicDimension[];
  overallCoverage: number;       // 0-100 percentage
}

interface MeddicDimension {
  key: "metrics" | "economic_buyer" | "decision_criteria" | "decision_process" | "identify_pain" | "champion";
  label: string;
  status: "known" | "partial" | "missing";
  evidence: string | null;
  sourceMeetingId: string | null;
  sourceMeetingTopic: string | null;
}
```

How each dimension is assessed:

| Dimension | Source | "known" Criteria | "partial" Criteria |
|-----------|--------|------------------|--------------------|
| Metrics | `meeting_score.lead_score` + reasoning | Reasoning mentions ROI/revenue/budget/cost/numbers | Lead score exists but no metric keywords |
| Economic Buyer | `participant_names` | Participant has senior title (VP, Director, Chief, CEO, etc.) | -- |
| Decision Criteria | `meeting_score.deal_sentiment` | -- | Deal sentiment exists |
| Decision Process | `meeting_score.tentative_closure_date` or `next_actionables` | Closure date exists | Only next actionables exist |
| Identify Pain | `icp_score.icp_alignment_signals` or `reason_for_score` | Alignment signals array is non-empty | Only reason exists |
| Champion | `primary_participant_name` frequency | Same contact in 3+ meetings | Same contact in 2 meetings |

Coverage formula: `((known_count + partial_count * 0.5) / 6) * 100`, rounded to integer.

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 500 | Database query error | `{ "error": "<supabase error message>" }` |
| 500 | Internal error | `{ "error": "Internal server error" }` |

### Rate Limits

None at the API level.

### Called By

- `src/lib/hooks/use-company-intelligence.ts` -- Custom React hook that fetches intelligence data.
- `src/components/companies/intelligence-sidebar/index.tsx` -- The intelligence sidebar on the company detail page. Renders all 7 sections via sub-components:
  - `health-pulse-section.tsx`
  - `stakeholders-section.tsx`
  - `deal-status-section.tsx`
  - `risk-signals-section.tsx`
  - `action-items-section.tsx`
  - `competitor-section.tsx`
  - `meddic-section.tsx`

---

## 7. GET /api/meetings/[id]/notes

Fetches all notes for a specific meeting, ordered by creation date (newest first).

**Source:** `src/app/api/meetings/[id]/notes/route.ts`

### Request

**URL parameter:** `id` -- Meeting UUID.

```
GET /api/meetings/550e8400-e29b-41d4-a716-446655440000/notes
```

No request body.

### Response

**Success (200):**

```json
{
  "notes": [
    {
      "id": "note-uuid",
      "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
      "section": "general",
      "user_email": "tyler@fullfunnel.io",
      "user_name": "Tyler",
      "content": "Client seemed hesitant about the timeline",
      "created_at": "2026-04-03T14:30:00Z"
    }
  ]
}
```

If no notes exist, returns `{ "notes": [] }`.

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 500 | Database query error | `{ "error": "<supabase error message>" }` |

### Rate Limits

None.

### Called By

- `src/components/meetings/meeting-notes.tsx` -- The notes panel on the meeting detail page. Fetches notes on mount and after adding a new note.

---

## 8. POST /api/meetings/[id]/notes

Creates a new note on a specific meeting.

**Source:** `src/app/api/meetings/[id]/notes/route.ts`

### Request

**URL parameter:** `id` -- Meeting UUID.

```typescript
interface CreateNoteRequest {
  section: string;      // Note category (defaults to "general" if omitted).
  userEmail: string;    // Email of the note author.
  userName?: string;    // Display name (optional).
  content: string;      // Required. The note text. Whitespace-trimmed before insert.
}
```

**Example:**

```json
{
  "section": "coaching",
  "userEmail": "jake@fullfunnel.io",
  "userName": "Jake",
  "content": "Rep needs to work on asking more discovery questions upfront."
}
```

### Response

**Success (200):**

```json
{
  "note": {
    "id": "new-note-uuid",
    "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
    "section": "coaching",
    "user_email": "jake@fullfunnel.io",
    "user_name": "Jake",
    "content": "Rep needs to work on asking more discovery questions upfront.",
    "created_at": "2026-04-03T15:00:00Z"
  }
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing or empty `content` | `{ "error": "Note content is required" }` |
| 500 | Database insert error | `{ "error": "<supabase error message>" }` |

### Rate Limits

None.

### Called By

- `src/components/meetings/meeting-notes.tsx` -- The notes panel on the meeting detail page. Sends the note content, section, and user info when the user submits the note form.

---

## 9. POST /api/notifications/slack

Sends a message to a Slack channel using Block Kit formatting. Supports two delivery methods: Bot Token API (with channel selection) or Incoming Webhook (default channel only).

**Source:** `src/app/api/notifications/slack/route.ts`

### Request

```typescript
interface SlackPayload {
  title: string;        // Required. Header text (truncated to 150 chars).
  body: string;         // Required. Message body in mrkdwn format (truncated to 2800 chars).
  meetingUrl?: string;  // Optional. Adds a "View in Dashboard" button linking to this URL.
  channelId?: string;   // Optional. Target channel ID. Required for Bot Token delivery.
}
```

**Example:**

```json
{
  "title": "Meeting Score Alert: Acme Corp",
  "body": "*Score:* 4.2/10\n*Health:* Declining\n\nImmediate attention needed on this account.",
  "meetingUrl": "https://dashboard.fullfunnel.io/meetings/550e8400",
  "channelId": "C04ABC123"
}
```

### Message Format

The message is built using Slack Block Kit:

1. **Header block** -- `payload.title` (plain text, max 150 chars)
2. **Section block** -- `payload.body` (mrkdwn format, max 2800 chars)
3. **Actions block** (conditional) -- "View in Dashboard" primary button linking to `meetingUrl`
4. **Context block** -- Timestamp: "Sent from _Meeting Intelligence Dashboard_ at [datetime]"

### Delivery Methods

The route tries Bot Token first, then falls back to Webhook:

| Method | When Used | Env Var | Channel Selection |
|--------|-----------|---------|-------------------|
| Bot Token (`chat.postMessage`) | `SLACK_BOT_TOKEN` set AND `channelId` provided | `SLACK_BOT_TOKEN` | User selects from allowed channels |
| Incoming Webhook | `SLACK_WEBHOOK_URL` set (fallback) | `SLACK_WEBHOOK_URL` | Posts to webhook's default channel |

### Response

**Success (200):**

```json
{ "success": true, "channel": "C04ABC123" }
```

When using webhook (no channel returned):

```json
{ "success": true }
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `title` or `body` | `{ "error": "title and body are required" }` |
| 502 | Slack API returned an error | `{ "error": "Slack error: <slack_error_code>" }` |
| 502 | Webhook request failed | `{ "error": "Failed to send to Slack" }` |
| 503 | Neither `SLACK_BOT_TOKEN` nor `SLACK_WEBHOOK_URL` configured | `{ "error": "Slack not configured. Add SLACK_BOT_TOKEN or SLACK_WEBHOOK_URL to environment variables." }` |
| 503 | Credentials exist but no valid path (bot token without channelId, no webhook) | `{ "error": "No valid Slack credentials" }` |
| 500 | Internal error | `{ "error": "Internal server error" }` |

### Rate Limits

None at the API level. Slack itself has rate limits (1 message per second per channel for `chat.postMessage`).

### Called By

- `src/components/shared/send-to-slack.tsx` -- The "Send to Slack" dialog used across the dashboard. Fetches channels from `/api/slack/channels`, then posts the message with the selected channel.
- `src/components/meetings/meeting-actions/actions-menu.tsx` -- The meeting actions dropdown. Sends a quick share to Slack with meeting summary info.

---

## 10. GET /api/slack/channels

Lists Slack channels available for posting, filtered by an allow-list. Results are cached in-memory for 5 minutes.

**Source:** `src/app/api/slack/channels/route.ts`

### Request

No parameters or body.

```
GET /api/slack/channels
```

### Response

**Success (200):**

```json
{
  "channels": [
    { "id": "C04ABC123", "name": "meeting-intel" },
    { "id": "C04DEF456", "name": "general" },
    { "id": "C04GHI789", "name": "fullfunnel-alerts" }
  ]
}
```

Channels are sorted alphabetically by name.

**No bot token configured (200):**

```json
{
  "channels": [],
  "error": "SLACK_BOT_TOKEN not configured"
}
```

**Slack API error (200):**

```json
{
  "channels": [],
  "error": "<slack_error_code>"
}
```

Note: This endpoint always returns 200, even on error. The `error` field indicates what went wrong, but `channels` is always present (empty array on failure).

### Channel Filtering

Only channels matching the allow-list are returned. The allow-list is configured via:

| Source | Value |
|--------|-------|
| `SLACK_ALLOWED_CHANNELS` env var | Comma-separated channel name substrings |
| Default (no env var) | `["general", "meeting-intel", "fullfunnel"]` |

Matching is case-insensitive substring match. For example, the default `"fullfunnel"` matches channels named `fullfunnel-alerts`, `fullfunnel-internal`, etc.

### Caching

| Property | Value |
|----------|-------|
| Cache type | In-memory (module-level variable) |
| TTL | 5 minutes (300,000 ms) |
| Scope | Per server instance (not shared across serverless invocations) |

The cache stores the filtered channel list and a timestamp. If the cache is fresh (less than 5 minutes old), the cached list is returned without hitting Slack.

### Slack API Call

When cache is stale or empty, the route calls `conversations.list`:

```
POST https://slack.com/api/conversations.list
Authorization: Bearer <SLACK_BOT_TOKEN>
Body: types=public_channel&exclude_archived=true&limit=200
```

### Rate Limits

None at the API level. The 5-minute cache naturally limits Slack API calls.

### Called By

- `src/components/shared/send-to-slack.tsx` -- Fetches the channel list when the "Send to Slack" dialog opens. Populates a dropdown for channel selection.

---

## Environment Variables (All Endpoints)

| Variable | Used By | Required | Purpose |
|----------|---------|----------|---------|
| `ANTHROPIC_API_KEY` | `/api/chat`, `/api/actions/*` | Yes (for AI features) | Claude API authentication |
| `GEMINI_API_KEY` | `/api/chat` | No | Gemini embedding API. If missing, vector search is skipped |
| `SUPABASE_URL` | All DB routes | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | All DB routes | Yes | Supabase service role key for server-side access |
| `DAILY_QUERY_LIMIT` | `/api/chat` | No (default: 50) | Max RAG queries per user per day |
| `BURST_QUERY_LIMIT` | `/api/chat` | No (default: 10) | Max RAG queries per user per 5-minute window |
| `SLACK_BOT_TOKEN` | `/api/notifications/slack`, `/api/slack/channels` | No | Slack Bot token for channel posting |
| `SLACK_WEBHOOK_URL` | `/api/notifications/slack` | No | Slack Incoming Webhook URL (fallback) |
| `SLACK_ALLOWED_CHANNELS` | `/api/slack/channels` | No (default: general,meeting-intel,fullfunnel) | Comma-separated channel name patterns |

---

## Database Tables Used

| Table / View | Endpoints |
|--------------|-----------|
| `meetings_list` (view) | `/api/chat` (Layer 1 scores) |
| `scored_meetings` | `/api/chat` (Layer 2 intelligence), `/api/actions/draft-email`, `/api/actions/meeting-prep`, `/api/actions/resummarize`, `/api/companies/[name]/intelligence` |
| `meeting_chunks` | `/api/chat` (vector search via RPC), `/api/companies/[name]/intelligence` (competitor search) |
| `chat_analytics` | `/api/chat` (rate limiting + logging), `/api/analytics/chat` (event logging) |
| `meeting_notes` | `/api/meetings/[id]/notes` (read + write) |

---

## Common Patterns

### Fire-and-Forget Logging

Analytics inserts never block the response. Two patterns are used:

Server-side (promise with empty handlers):
```typescript
supabase.from("chat_analytics").insert({ ... }).then(() => {}, () => {});
```

Client-side (caught fetch):
```typescript
fetch("/api/analytics/chat", { ... }).catch(() => {});
```

### Claude Usage Across Endpoints

All Claude-powered endpoints use the same model and SDK:

| Endpoint | Model | Max Tokens | Input Limit |
|----------|-------|------------|-------------|
| `/api/chat` | claude-sonnet-4-20250514 | 4096 | Full score data + top chunks |
| `/api/actions/draft-email` | claude-sonnet-4-20250514 | 1024 | 8,000 char transcript |
| `/api/actions/meeting-prep` | claude-sonnet-4-20250514 | 1500 | 10 meetings, truncated JSONB |
| `/api/actions/resummarize` | claude-sonnet-4-20250514 | 1500 | 10,000 char transcript |

### Graceful Degradation

- Missing `GEMINI_API_KEY`: vector search skipped, chat still works with score data
- Missing `SLACK_BOT_TOKEN` + `SLACK_WEBHOOK_URL`: Slack endpoints return 503 with clear message
- Rate limit DB error: chat query proceeds (fail-open)
- Analytics insert error: silently ignored
- Slack channel fetch error: returns empty array with error message (still 200)
