# 03 — Database Schema

> **Audience:** GTM Engineers, Senior Leadership
> **Last Updated:** April 4, 2026
> **Supabase Project ID:** cxrjlmquzhfueqrudiuy

---

## Overview

The Meeting Intelligence Dashboard uses 7 Supabase (PostgreSQL) tables plus 1 RPC function. The tables split cleanly into two ownership domains:

| Domain | Tables | Who Writes | Who Reads |
|--------|--------|-----------|-----------|
| **n8n Pipeline** | `scored_meetings`, `meetings_list`, `meeting_chunks`, `scoring_run_log`, `zoom_users` | n8n workflows (MI\|1 through MI\|4) | Dashboard (read-only) |
| **Dashboard** | `chat_analytics`, `meeting_notes`, `notification_preferences` | Next.js API routes | Next.js API routes + UI |
| **Config** | `user_roles`, `scoring_config` | Admin API | Dashboard (read-only) |

**Critical rule:** The dashboard NEVER writes to n8n-owned tables. The n8n pipeline NEVER writes to dashboard-owned tables. This boundary is enforced by application convention (not RLS), and violating it risks data corruption on either side.

---

## Table 1: `scored_meetings` (n8n domain — read-only)

The primary table. Contains full meeting records with AI-generated JSONB score payloads. Each row represents one scored Zoom meeting.

**Written by:** n8n MI|1 (capture), MI|2 (transcript enrichment), MI|3 (AI scoring), MI|4 (embedding timestamp)
**Read by:** Meeting Detail page, Chat API (for JSONB intelligence), Sync Status hook, Pipeline Stats hook, Company Intelligence API, Action APIs (draft email, resummarize, meeting prep)

### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | NO (PK) | Auto-generated primary key |
| `meeting_uuid` | `text` | NO | Zoom's internal meeting UUID |
| `zoom_meeting_id` | `bigint` | YES | Zoom numeric meeting ID |
| `topic` | `text` | YES | Meeting title from Zoom calendar |
| `host_name` | `text` | YES | Rep who hosted the call |
| `host_email` | `text` | YES | Host's email address |
| `company_name` | `text` | YES | Resolved company name (from HubSpot or AI extraction) |
| `company_domain` | `text` | YES | Company website domain |
| `primary_participant_name` | `text` | YES | Main external participant (prospect/client) |
| `primary_participant_email` | `text` | YES | External participant's email |
| `participant_names` | `jsonb` | YES | Array of all participant names |
| `participant_emails` | `jsonb` | YES | Array of all participant emails |
| `scoring_stage_type` | `text` | YES | One of: `discovery_scoping`, `follow_up`, `onboarding`, `internal` |
| `meeting_stage` | `text` | YES | Raw stage string before normalization |
| `start_time` | `timestamptz` | YES | When the meeting started |
| `duration_minutes` | `int` | YES | Meeting length in minutes |
| `recording_url` | `text` | YES | Zoom cloud recording URL |
| `transcript_url` | `text` | YES | Zoom transcript file URL |
| `has_transcript` | `boolean` | NO | Whether transcript was successfully retrieved |
| `transcript_text` | `text` | YES | Full meeting transcript (~23K chars average) |
| `word_count` | `int` | YES | Transcript word count |
| `meeting_summary` | `text` | YES | AI-generated 2-3 sentence summary |
| `ai_extracted_participants` | `jsonb` | YES | AI-parsed participant list from transcript |
| `ai_meeting_theme` | `text` | YES | AI-detected meeting theme |
| `resolution_method` | `text` | YES | How company name was resolved (hubspot/ai/manual) |
| `hubspot_contact_id` | `text` | YES | HubSpot contact record ID |
| `hubspot_company_id` | `text` | YES | HubSpot company record ID |
| `hubspot_updated` | `boolean` | NO | Whether HubSpot was updated with meeting data |
| `scoring_stage_type` | `text` | YES | Stage classification for score routing |
| `rep_score` | `jsonb` | YES | Rep performance scores (structure varies by stage) |
| `meeting_score` | `jsonb` | YES | Meeting-level scores (structure varies by stage) |
| `icp_score` | `jsonb` | YES | ICP fit analysis (discovery stage only) |
| `engagement_score` | `jsonb` | YES | Engagement analysis (follow_up stage — mirrors meeting_score) |
| `delivery_score` | `jsonb` | YES | Delivery analysis (onboarding stage — mirrors meeting_score) |
| `internal_summary` | `jsonb` | YES | Structured internal meeting summary (internal stage only) |
| `overall_score` | `numeric` | YES | Computed overall meeting score (0-10 scale) |
| `client_health_score` | `numeric` | YES | Account health indicator (0-10 scale) |
| `google_doc_url` | `text` | YES | Link to Google Doc with formatted meeting notes |
| `status` | `text` | NO | Pipeline status: `captured`, `scored`, `error` |
| `error_message` | `text` | YES | Error details if scoring failed |
| `scoring_model` | `text` | YES | Which LLM model performed scoring |
| `scored_at` | `timestamptz` | YES | When AI scoring completed |
| `captured_at` | `timestamptz` | YES | When the meeting was first ingested |
| `updated_at` | `timestamptz` | YES | Last modification timestamp |
| `embedded_at` | `timestamptz` | YES | When transcript was chunked + embedded for RAG |

### JSONB Score Structures by Stage Type

Each `scoring_stage_type` produces different JSONB payloads in the score columns. The n8n MI|3 pipeline routes meetings to stage-specific LLM prompts, so the output fields differ.

**Important patterns:**
- `rep_score` fields like `strengths` and `areas_for_improvement` are **paragraphs** (text strings), not arrays.
- For `follow_up` meetings, the `engagement_score` column contains the same structure as `meeting_score` (duplicated by n8n).
- For `onboarding` meetings, the `delivery_score` column contains the same structure as `meeting_score` (duplicated by n8n).
- All numeric scores use a **0-10 scale**.

---

#### Stage: `discovery_scoping`

**`rep_score` JSONB:**

```json
{
  "strengths": "Tyler did an excellent job establishing rapport early in the call and asking probing questions about the prospect's current tech stack. He naturally transitioned from pain discovery to solution positioning without being pushy.",
  "areas_for_improvement": "Could have dug deeper into the budget timeline. The conversation moved to next steps before fully qualifying the decision-making process.",
  "handling_analysis": "Handled the competitor objection well by redirecting to FullFunnel's unique multi-channel approach. Missed an opportunity to address the implementation timeline concern.",
  "rep_performance_score": 7.8,
  "meeting_quality_rating": "good",
  "coaching_recommendations": "Practice the BANT framework more explicitly. Next discovery call should include at least one question about budget authority and approval process before proposing next steps.",
  "deal_progression_assessment": "Deal is progressing well. Prospect showed genuine interest in the data enrichment capabilities. Recommend scheduling a technical demo within 5 business days."
}
```

**`meeting_score` JSONB:**

```json
{
  "lead_score": 7.5,
  "deal_sentiment": "positive",
  "next_actionables": "1. Send the case study for SaaS companies. 2. Schedule a technical demo with their RevOps lead. 3. Follow up on the pricing proposal by Friday.",
  "last_meeting_date": "2026-03-28",
  "reasoning_summary": "Strong initial discovery. Prospect has clear pain around outbound efficiency and expressed interest in Clay + HubSpot integration. Budget discussion was vague but they mentioned Q2 planning.",
  "tentative_closure_date": "2026-05-15"
}
```

**`icp_score` JSONB:**

```json
{
  "icp_fit_score": 8.2,
  "title_fit_score": 7.0,
  "confidence_level": "high",
  "reason_for_score": "Company is a Series B SaaS with 150 employees, selling to enterprise. VP of Revenue Operations is the primary contact — strong title fit. Industry (HealthTech) is adjacent to core ICP but has proven success patterns.",
  "industry_fit_score": 6.5,
  "department_fit_score": 8.0,
  "icp_alignment_signals": [
    "150 employees — mid-market sweet spot",
    "VP RevOps title — decision maker",
    "Already using HubSpot — integration ready",
    "Expressed pain around outbound efficiency"
  ],
  "company_size_fit_score": 8.5,
  "icp_misalignment_signals": [
    "HealthTech vertical — not core ICP",
    "No existing Clay usage — longer onboarding"
  ]
}
```

**Active columns:** `rep_score`, `meeting_score`, `icp_score`
**Null columns:** `engagement_score`, `delivery_score`, `internal_summary`

---

#### Stage: `follow_up`

**`rep_score` JSONB:**

```json
{
  "strengths": "Strong relationship management. Jake maintained a consultative tone throughout and referenced specific outcomes from the previous call, showing preparation.",
  "blind_spots": "Did not probe on the new stakeholder who joined the call. Could have explored their role in the decision process.",
  "areas_for_improvement": "Should have addressed the timeline slip more directly instead of accepting the 'we'll circle back next month' response.",
  "rep_performance_score": 6.9,
  "meeting_quality_rating": "average",
  "coaching_recommendations": "When a prospect delays, use the 'cost of inaction' framework. Quantify what they lose each month without the solution."
}
```

**`meeting_score` JSONB (also duplicated in `engagement_score`):**

```json
{
  "engagement_level": "moderate",
  "engagement_score": 6.5,
  "expansion_signals": [
    "Mentioned wanting to add 2 more reps to the platform",
    "Asked about API access for custom integrations"
  ],
  "reasoning_summary": "Client is engaged but not urgently moving forward. The new stakeholder may be a blocker or a champion — needs qualification.",
  "churn_risk_signals": [
    "Mentioned evaluating 'other options'",
    "Postponed the contract renewal discussion"
  ],
  "relationship_health": "stable — needs nurturing"
}
```

**Active columns:** `rep_score`, `meeting_score`, `engagement_score` (duplicate of meeting_score)
**Null columns:** `icp_score`, `delivery_score`, `internal_summary`

---

#### Stage: `onboarding`

**`rep_score` JSONB:**

```json
{
  "strengths": "Clear communication of project milestones. Kept the client focused on the current sprint deliverables and managed expectations well.",
  "blind_spots": "Didn't address the client's concern about data migration timelines. They mentioned it twice and it was acknowledged but not resolved.",
  "areas_for_improvement": "Should provide written timelines after each onboarding call. Verbal commitments are being forgotten.",
  "rep_performance_score": 7.2,
  "meeting_quality_rating": "good",
  "coaching_recommendations": "Start each onboarding call with a 2-minute recap of where things stand and what was completed since the last call. End with a written summary of commitments."
}
```

**`meeting_score` JSONB (also duplicated in `delivery_score`):**

```json
{
  "blockers": [
    "Client's IT team hasn't provided API credentials",
    "HubSpot custom property mapping needs client approval"
  ],
  "current_phase": "Week 3 — Data Integration",
  "delivery_score": 7.0,
  "delivery_status": "on_track",
  "project_progress": "65% complete. Core workflows are built. Waiting on client-side integrations.",
  "reasoning_summary": "Onboarding is progressing steadily. Two blockers are client-dependent. If resolved by next week, the project stays on the 6-week timeline.",
  "milestones_discussed": [
    "HubSpot integration — completed",
    "Clay enrichment workflows — completed",
    "Outbound sequence setup — in progress",
    "Reporting dashboard — not started"
  ]
}
```

**Active columns:** `rep_score`, `meeting_score`, `delivery_score` (duplicate of meeting_score)
**Null columns:** `icp_score`, `engagement_score`, `internal_summary`

---

#### Stage: `internal`

**`internal_summary` JSONB:**

```json
{
  "quality": {
    "key_insight": "Team alignment on Q2 pipeline targets. Decision to increase outbound volume by 30% and shift focus to mid-market SaaS.",
    "facilitation_notes": "Meeting ran 10 minutes over. Could tighten the client review section.",
    "productivity_rating": "productive",
    "meeting_quality_score": 7.5
  },
  "summary": {
    "headline": "Q2 Pipeline Planning + Client Health Review",
    "key_topics": [
      "Q2 revenue targets",
      "Outbound volume increase",
      "Client health dashboard review",
      "New hire onboarding timeline"
    ],
    "meeting_type": "team_standup",
    "duration_assessment": "slightly_over"
  },
  "action_items": [
    {
      "owner": "Jake",
      "action": "Build the Q2 outbound sequence in Instantly by Friday",
      "context": "Discussed during pipeline review section",
      "deadline": "2026-04-11",
      "priority": "high"
    },
    {
      "owner": "Tyler",
      "action": "Schedule onboarding kickoff for TechCorp",
      "context": "New client signed last week",
      "deadline": "2026-04-08",
      "priority": "medium"
    },
    {
      "owner": "Neeraj",
      "action": "Finalize the reporting dashboard requirements",
      "context": "Needed before dev sprint starts",
      "deadline": "2026-04-10",
      "priority": "high"
    }
  ],
  "kantata_tasks": [
    {
      "title": "Q2 outbound sequence build",
      "assignee": "Jake",
      "due_date": "2026-04-11"
    }
  ],
  "decisions_made": [
    {
      "impact": "Requires hiring 1 additional SDR by end of April",
      "decision": "Increase outbound volume by 30% for Q2",
      "rationale": "Current pipeline coverage is 2.5x — need 3.5x for Q2 targets"
    },
    {
      "impact": "Jake and Tyler to split mid-market accounts evenly",
      "decision": "Shift ICP focus to mid-market SaaS (100-500 employees)",
      "rationale": "Higher close rates and shorter sales cycles in this segment"
    }
  ],
  "open_questions": [
    "Should we add a dedicated CSM role or keep it with the rep?",
    "Timeline for the new CRM reporting layer?"
  ],
  "client_references": [
    {
      "context": "Onboarding is 2 weeks behind. Client expressed frustration about data migration.",
      "sentiment": "concern",
      "client_name": "HealthBridge Solutions",
      "action_needed": true
    },
    {
      "context": "Expanding to 3 additional reps next month. Very happy with results.",
      "sentiment": "positive",
      "client_name": "RevStack AI",
      "action_needed": false
    },
    {
      "context": "Contract renewal in 6 weeks. No red flags.",
      "sentiment": "neutral",
      "client_name": "DataPulse",
      "action_needed": false
    }
  ]
}
```

**Active columns:** `internal_summary`
**Null columns:** `rep_score` (sometimes populated), `meeting_score`, `icp_score`, `engagement_score`, `delivery_score`

**Note on internal meetings:** The `meeting_score` column for internal meetings may contain a simplified quality object (same structure as `internal_summary.quality`). The `internal_summary` column is the canonical source for internal meetings.

---

## Table 2: `meetings_list` (n8n domain — read-only)

A lightweight PostgreSQL **view** (not a table) on `scored_meetings`. Excludes heavy columns (`transcript_text`, all JSONB score columns) for fast list rendering.

**Written by:** Automatically derived from `scored_meetings`
**Read by:** Team Scorecard page, Meeting Feed page, Company pages, Rep Profile pages, Chat API (for score summaries)

### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | NO | Matches `scored_meetings.id` |
| `topic` | `text` | YES | Meeting title |
| `host_name` | `text` | YES | Rep name |
| `company_name` | `text` | YES | Company name |
| `primary_participant_name` | `text` | YES | External participant |
| `scoring_stage_type` | `text` | YES | Stage classification |
| `start_time` | `timestamptz` | YES | Meeting start time |
| `duration_minutes` | `int` | YES | Duration |
| `overall_score` | `numeric` | YES | Overall score (0-10) |
| `client_health_score` | `numeric` | YES | Health score (0-10) |
| `meeting_summary` | `text` | YES | AI-generated summary |
| `google_doc_url` | `text` | YES | Google Doc link |

### Why a View?

The `meetings_list` view exists because `scored_meetings` rows are **large** — each row contains ~23K chars of transcript text plus multiple JSONB payloads. Loading all 76 meetings with full payloads for a list page would transfer ~2MB+ of unnecessary data. The view selects only the 12 columns needed for cards and tables.

---

## Table 3: `meeting_chunks` (n8n domain — read-only)

Transcript chunks with vector embeddings for RAG (Retrieval-Augmented Generation) search. Each meeting's transcript is split into overlapping chunks by the n8n MI|4 pipeline, then embedded using Google's Gemini Embedding API.

**Written by:** n8n MI|4 (Chunk + Embed pipeline)
**Read by:** Chat API (via `match_meeting_chunks` RPC function)

### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | NO (PK) | Auto-generated primary key |
| `meeting_id` | `uuid` | NO (FK) | References `scored_meetings.id` |
| `chunk_text` | `text` | NO | Transcript excerpt (~500-800 tokens per chunk) |
| `chunk_embedding` | `halfvec(3072)` | NO | 3072-dimensional vector from Gemini Embedding API (`gemini-embedding-001`). Uses `halfvec` (16-bit floats) instead of `vector` to halve storage costs. |
| `metadata` | `jsonb` | YES | Context for the chunk |

### Metadata JSONB Structure

```json
{
  "meeting_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "company_name": "TechCorp",
  "host_name": "Tyler",
  "topic": "Discovery Call — TechCorp RevOps",
  "start_time": "2026-03-15T14:00:00Z"
}
```

### Indexes

- **pgvector IVFFlat index** on `chunk_embedding` for approximate nearest neighbor search. This is what makes `match_meeting_chunks` fast.
- Standard B-tree index on `meeting_id` for join queries.

### Current Stats

- **611 chunks** across 76 meetings
- Average **~8 chunks per meeting**
- Embedding model: `gemini-embedding-001` (3072 dimensions)
- Storage format: `halfvec` (half-precision, 6KB per vector instead of 12KB)

---

## Table 4: `scoring_run_log` (n8n domain — read-only)

Pipeline execution history. Each row represents one run of an n8n scoring workflow. Used by the System Health page to show pipeline status and processing history.

**Written by:** n8n MI|3 (Score Meetings workflow)
**Read by:** System Health page (Processing Log, Pipeline Status)

### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | NO (PK) | Auto-generated primary key |
| `workflow_name` | `text` | NO | n8n workflow identifier (e.g., `MI\|3: Score Meetings`) |
| `run_started_at` | `timestamptz` | NO | When the pipeline run began |
| `run_completed_at` | `timestamptz` | YES | When the pipeline run finished (null if still running) |
| `meetings_captured` | `int` | NO | Number of meetings found in this run |
| `meetings_scored` | `int` | NO | Number successfully scored |
| `meetings_failed` | `int` | NO | Number that failed scoring |
| `meetings_no_contact` | `int` | NO | Number skipped due to no HubSpot contact match |
| `error_details` | `jsonb` | YES | Structured error information for failed meetings |
| `status` | `text` | NO | Run status: `running`, `completed`, `partial`, `failed` |

### Error Details JSONB Structure

```json
{
  "failures": [
    {
      "meeting_id": "abc-123",
      "topic": "Discovery Call — Acme",
      "error": "Token limit exceeded — transcript too long",
      "stage": "scoring"
    }
  ],
  "warnings": [
    "2 meetings had empty transcripts — skipped"
  ]
}
```

---

## Table 5: `zoom_users` (n8n domain — read-only)

Rep configuration table. Maps Zoom user accounts to display names and HubSpot owner IDs. Controls which reps' meetings are captured and scored.

**Written by:** n8n MI|1 (weekly user sync from Zoom API)
**Read by:** Meeting Feed filters (rep dropdown), Pipeline Stats, System Health

### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | NO (PK) | Auto-generated primary key |
| `zoom_user_id` | `text` | YES | Zoom's internal user identifier |
| `email` | `text` | YES | Rep's email address |
| `display_name` | `text` | YES | Full display name (used in filters and tables) |
| `first_name` | `text` | YES | First name |
| `last_name` | `text` | YES | Last name |
| `classification` | `text` | YES | User classification (e.g., `licensed`, `basic`) |
| `enabled_for_scoring` | `boolean` | NO | Whether this rep's meetings should be captured. Set to `false` to exclude a user from the pipeline. |
| `hubspot_owner_id` | `text` | YES | Corresponding HubSpot owner ID for CRM linking |

### Current Rep Roster

The `enabled_for_scoring = true` filter determines which reps appear in the dashboard. Currently 5 reps are enabled for scoring.

---

## Table 6: `chat_analytics` (dashboard domain — dashboard writes)

Tracks all usage of the Ask Blarney (RAG chat) feature. Every query, feedback event, and interaction is logged for usage analytics, rate limiting, and system monitoring.

**Created by:** Supabase migration (dashboard codebase)
**Written by:** `/api/chat` route (query events), `/api/analytics/chat` route (all event types)
**Read by:** Rate limiting logic in `/api/chat`, future analytics dashboards

### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | NO (PK) | Auto-generated primary key, `gen_random_uuid()` default |
| `session_id` | `text` | YES | Browser session identifier for grouping conversation turns |
| `user_email` | `text` | YES | Authenticated user's email |
| `event_type` | `text` | YES | Event classification (see enum below) |
| `query` | `text` | YES | User's question text (only for `query` events) |
| `response_length` | `int` | YES | Character count of AI response |
| `sources_count` | `int` | YES | Number of meeting sources cited |
| `chunks_retrieved` | `int` | YES | Number of transcript chunks retrieved from vector search |
| `had_chart` | `boolean` | YES | Whether the response included a chart block |
| `latency_ms` | `int` | YES | End-to-end response time in milliseconds |
| `error_message` | `text` | YES | Error details if the query failed |
| `created_at` | `timestamptz` | NO | Timestamp, defaults to `now()` |

### Event Types

| Event Type | When Logged | Fields Populated |
|-----------|-------------|-----------------|
| `query` | User submits a question | `query`, `chunks_retrieved`, `sources_count`, `latency_ms` |
| `thumbs_up` | User gives positive feedback | `session_id` |
| `thumbs_down` | User gives negative feedback | `session_id` |
| `copy` | User copies a response | `session_id` |
| `email_share` | User shares response via email | `session_id` |
| `clear` | User clears conversation | `session_id` |
| `followup_click` | User clicks a suggested follow-up | `query` (the follow-up text) |
| `chart_download` | User downloads a chart as PNG | `session_id` |

### Indexes

```sql
CREATE INDEX idx_chat_analytics_session ON chat_analytics(session_id);
CREATE INDEX idx_chat_analytics_created ON chat_analytics(created_at DESC);
CREATE INDEX idx_chat_analytics_user_date ON chat_analytics(user_email, created_at);
```

### Row-Level Security (RLS)

```sql
-- Authenticated users can insert their own analytics events
CREATE POLICY "Users can insert analytics"
  ON chat_analytics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can read analytics (for future admin dashboard)
CREATE POLICY "Users can read analytics"
  ON chat_analytics FOR SELECT
  TO authenticated
  USING (true);
```

### Rate Limiting

The Chat API uses `chat_analytics` for two-tier rate limiting:

| Limit | Window | Max Queries | Error Code |
|-------|--------|-------------|------------|
| **Daily** | Midnight reset (UTC) | 50 queries per user | 429 |
| **Burst** | Rolling 5 minutes | 10 queries per user | 429 |

Configurable via environment variables: `DAILY_QUERY_LIMIT`, `BURST_QUERY_LIMIT`. Rate limit checks fail open — if the analytics table is unavailable, queries are allowed through.

---

## Table 7: `meeting_notes` (dashboard domain — dashboard writes)

Section-level notes that team members can add to any meeting. Notes are tied to specific sections of the meeting detail view (summary, coaching, actions, etc.) so they appear in context.

**Created by:** Supabase migration (dashboard codebase)
**Written by:** `/api/meetings/[id]/notes` route (POST)
**Read by:** `/api/meetings/[id]/notes` route (GET), Meeting Detail page (Meeting Notes component)

### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | NO (PK) | Auto-generated primary key, `gen_random_uuid()` default |
| `meeting_id` | `uuid` | NO | References the meeting this note belongs to |
| `section` | `text` | YES | Which section the note is attached to |
| `user_email` | `text` | YES | Who wrote the note |
| `user_name` | `text` | YES | Display name of the author |
| `content` | `text` | NO | The note text (trimmed on insert) |
| `created_at` | `timestamptz` | NO | Timestamp, defaults to `now()` |

### Section Values

| Section | Where It Appears |
|---------|-----------------|
| `summary` | Summary tab of Intelligence Tabs |
| `coaching` | Coaching tab |
| `actions` | Action Items tab |
| `decisions` | Decisions tab |
| `clients` | Client References tab |
| `general` | Default — appears at bottom of meeting detail |

### Indexes

```sql
CREATE INDEX idx_meeting_notes_meeting ON meeting_notes(meeting_id, created_at DESC);
CREATE INDEX idx_meeting_notes_section ON meeting_notes(meeting_id, section);
```

### Row-Level Security (RLS)

```sql
-- Authenticated users can insert notes
CREATE POLICY "Users can insert notes"
  ON meeting_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can read all notes
CREATE POLICY "Users can read notes"
  ON meeting_notes FOR SELECT
  TO authenticated
  USING (true);
```

---

## RPC Function: `match_meeting_chunks`

PostgreSQL function that performs cosine similarity search against the `meeting_chunks` vector index. This is the core of the RAG pipeline — it finds transcript chunks semantically similar to the user's question.

**Called by:** `/api/chat` route
**Returns:** Top N chunks ranked by similarity score

### Signature

```sql
CREATE OR REPLACE FUNCTION match_meeting_chunks(
  query_embedding text,
  match_count int DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id,
    mc.chunk_text AS content,
    mc.metadata,
    1 - (mc.chunk_embedding <=> query_embedding::halfvec(3072)) AS similarity
  FROM meeting_chunks mc
  ORDER BY mc.chunk_embedding <=> query_embedding::halfvec(3072)
  LIMIT match_count;
END;
$$;
```

### How It Works

1. The Chat API embeds the user's question using Gemini Embedding API (`gemini-embedding-001`).
2. The embedding is passed as a text string (e.g., `"[0.012, -0.034, ...]"`) and cast to `halfvec(3072)`.
3. The `<=>` operator computes cosine distance (pgvector).
4. Results are sorted by similarity (1 - cosine_distance), so 1.0 = identical, 0.0 = orthogonal.
5. The Chat API filters results with `similarity > 0.3` to exclude low-quality matches.

### Dynamic Chunk Count

The Chat API adjusts `match_count` based on query breadth:

| Query Pattern | Chunk Count |
|--------------|-------------|
| Broad queries (contains "compare", "all reps", "breakdown", "overview") | 15 |
| Long queries (30+ words) | 12 |
| Standard queries | 8 |

---

## Entity Relationship Diagram

```
scored_meetings (PK: id)
     │
     ├──── meetings_list (VIEW — same PK, subset of columns)
     │
     ├──1:N── meeting_chunks (FK: meeting_id → scored_meetings.id)
     │
     ├──1:N── meeting_notes (FK: meeting_id, dashboard-created)
     │
     └──────── chat_analytics (no FK — standalone, dashboard-created)

scoring_run_log (standalone — pipeline observability)

zoom_users (standalone — rep configuration)
```

---

## Data Flow Summary

```
                         n8n WRITES                    Dashboard READS
                    ┌──────────────────┐          ┌──────────────────────┐
Zoom API ──────────>│  scored_meetings │──────────>│ Meeting Detail page  │
                    │  meetings_list   │──────────>│ Scorecard, Feed      │
Gemini Embed ──────>│  meeting_chunks  │──RPC────>│ Chat API (RAG)       │
                    │  scoring_run_log │──────────>│ System Health page   │
Zoom Users API ────>│  zoom_users      │──────────>│ Filter dropdowns     │
                    └──────────────────┘          └──────────────────────┘

                       Dashboard WRITES              Dashboard READS
                    ┌──────────────────┐          ┌──────────────────────┐
Chat API ──────────>│  chat_analytics  │──────────>│ Rate limiting        │
Notes API ─────────>│  meeting_notes   │──────────>│ Meeting Detail page  │
                    └──────────────────┘          └──────────────────────┘
```

---

## Score Bands

The dashboard uses consistent score banding across all pages:

| Band | Range | Label | Color |
|------|-------|-------|-------|
| High | 8.0 - 10.0 | Strong | Emerald |
| Medium | 6.0 - 7.9 | Average | Yellow |
| Low | 0.0 - 5.9 | Needs Work | Red |

These bands apply to `overall_score`, `client_health_score`, `rep_performance_score`, `lead_score`, `engagement_score`, `delivery_score`, `icp_fit_score`, and `meeting_quality_score`.

---

## Querying Tips

### Get all meetings for a company

```sql
SELECT id, topic, host_name, start_time, overall_score, scoring_stage_type
FROM meetings_list
WHERE company_name = 'TechCorp'
ORDER BY start_time DESC;
```

### Get coaching recommendations for a rep

```sql
SELECT topic, start_time, rep_score->>'coaching_recommendations' AS coaching
FROM scored_meetings
WHERE host_name = 'Tyler'
  AND rep_score IS NOT NULL
ORDER BY start_time DESC;
```

### Check pipeline health

```sql
SELECT workflow_name, run_started_at, status, meetings_scored, meetings_failed
FROM scoring_run_log
ORDER BY run_started_at DESC
LIMIT 10;
```

### Find high-risk accounts

```sql
SELECT DISTINCT company_name, client_health_score, overall_score
FROM meetings_list
WHERE client_health_score < 6
  AND company_name IS NOT NULL
ORDER BY client_health_score ASC;
```

### Check Ask Blarney usage

```sql
SELECT user_email, COUNT(*) AS query_count, AVG(latency_ms) AS avg_latency
FROM chat_analytics
WHERE event_type = 'query'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_email
ORDER BY query_count DESC;
```

---

## Table 8: `notification_preferences` (Dashboard domain)

Per-user, per-section notification settings. Controls which digest types are delivered to which section channels.

**Written by:** `/api/notifications/preferences` (PUT)
**Read by:** `/api/notifications/digest` (checks before sending), `/app/settings` (UI display)
**Migration:** `migration/sql/2026-05-13-notification-preferences.sql`

### Columns

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | Auto-increment |
| `user_email` | text NOT NULL | FK to `user_roles.email` (UNIQUE constraint) |
| `section` | text NOT NULL | `'sales'`, `'cs'`, `'internal'`, or `'all'`. CHECK constraint. |
| `channel` | text NOT NULL | `'slack'` or `'email'`. CHECK constraint. |
| `frequency` | text NOT NULL | `'realtime'`, `'hourly'`, `'daily'`, `'weekly'`. Default `'daily'`. |
| `slack_channel_id` | text | Override channel ID (currently unused, uses env vars) |
| `is_active` | boolean | Default `true`. When false, section channel is suppressed. |
| `thresholds` | jsonb | `{"low_score": 5, "health_drop": 2}`. Controls alert sensitivity. |
| `created_at` | timestamptz | Default `now()` |
| `updated_at` | timestamptz | Default `now()`, updated on PUT |

### Constraints
- `UNIQUE(user_email, section, channel)` - one preference per user per section per channel
- `user_email` FK references `user_roles(email)` - requires UNIQUE on `user_roles.email`

### RLS Policies
- Users read/update/insert own preferences (matched by `auth.jwt()->>'email'`)
- Service role has full access (used by digest engine)

---

## Table 9: `user_roles` (Config domain)

User accounts with role-based access control.

**Written by:** Admin API (`/api/admin/users`)
**Read by:** Middleware (auth guard), sidebar (section filtering), preferences API

### Key Constraints (added 2026-05-13)
- `user_roles_email_unique` UNIQUE constraint on `email` column (required for `notification_preferences` FK)

---

## Table 10: `scoring_config` (Config domain)

Stage-specific scoring configuration. 6 rows, one per scoring stage type.

**Written by:** Manual SQL (admin)
**Read by:** n8n MI|3 (reads prompts + weights), Dashboard (score display)

---

## RPC Function 2: `detect_pipeline_triggers()`

Cross-meeting trend detection. Compares consecutive meetings per company to identify deal movement.

**Migration:** `migration/sql/2026-05-13-pipeline-triggers.sql`
**Called by:** `/api/notifications/triggers` (GET)
**Security:** SECURITY DEFINER (runs with owner permissions)

### Return Columns

| Column | Type | Description |
|--------|------|-------------|
| `company_name` | text | Company with detected trigger |
| `trigger_type` | text | `'deal_slipping'`, `'deal_accelerating'`, or `'poor_discovery'` |
| `current_meeting_id` | text | Most recent meeting ID |
| `previous_meeting_id` | text | Comparison meeting ID (null for poor_discovery) |
| `current_score` | numeric | Current health/overall score |
| `previous_score` | numeric | Previous score (null for poor_discovery) |
| `score_delta` | numeric | Score change (negative = declining) |
| `urgency` | text | `'high'` or `'medium'` |
| `details` | jsonb | Additional context (sentiment, stage type) |

### Trigger Logic
- **deal_slipping:** `client_health_score` dropped > 2 points between consecutive meetings for same company. Urgency: high.
- **deal_accelerating:** `client_health_score` rose > 2 points. Urgency: medium.
- **poor_discovery:** `overall_score` < 5 for `discovery_scoping` meetings in last 90 days. Urgency: high.

### SQL Approach
Uses `ROW_NUMBER() OVER (PARTITION BY company_name ORDER BY scored_at DESC)` to rank meetings per company, then self-joins `rn=1` with `rn=2` to compare consecutive scores. Only considers `discovery_scoping`, `follow_up`, and `client_meeting` stage types.

---

## `client_meeting` Stage - `meeting_score` JSONB Structure

When n8n MI|3 scores a `client_meeting` stage meeting, the `meeting_score` JSONB contains:

```jsonb
{
  "overall_health_score": 6.7,
  "sentiment_score": 7.0,
  "expansion_likelihood": "medium",
  "escalation_risk": "low",
  "relationship_health_score": 7.5,
  "category_scores": {
    "proactive_communication": { "score": 7, "weight": 20, "signals": [...], "watchouts": [...] },
    "expectation_management": { "score": 6, "weight": 20, ... },
    "value_delivery": { "score": 7, "weight": 20, ... },
    "relationship_building": { "score": 7, "weight": 15, ... },
    "issue_resolution": { "score": 6, "weight": 15, ... },
    "strategic_guidance": { "score": 7, "weight": 10, ... }
  },
  "strategic_signals": {
    "expansion_opportunity": true/false,
    "renewal_risk": true/false,
    "stakeholder_misalignment": true/false,
    "adoption_concerns": true/false,
    "sponsor_absent": true/false,
    "competitive_mention": true/false,
    "timeline_pressure": true/false
  },
  "coaching_signals": {
    "talk_ratio": 0.45,
    "interruption_count": 2,
    "question_quality": "high",
    "active_listening_score": 8,
    "empathy_score": 7,
    "engagement_level": "high",
    "confidence_level": "medium"
  },
  "call_notes": {
    "client_action_items": [...],
    "ff_action_items": [...],
    "kantata_action_items": [...]
  }
}
```

This structure is read by `buildCSInsights()` in `/api/companies/[name]/intelligence/route.ts` and rendered by `CSScores` component and `cs-insights-section.tsx`.
