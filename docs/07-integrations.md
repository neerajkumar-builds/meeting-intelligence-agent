# 07 - External Integrations

This document covers every external service the Meeting Intelligence Dashboard connects to, how each integration works, what configuration it requires, and where it surfaces in the UI.

---

## Table of Contents

1. [Slack Integration](#1-slack-integration)
2. [Supabase Auth](#2-supabase-auth)
3. [n8n Pipeline Contract](#3-n8n-pipeline-contract)
4. [Anthropic Claude API](#4-anthropic-claude-api)
5. [Google Gemini API](#5-google-gemini-api)
6. [HubSpot (Passive)](#6-hubspot-passive)
7. [Environment Variable Reference](#7-environment-variable-reference)

---

## 1. Slack Integration

The dashboard supports sending meeting summaries, AI chat responses, and action outputs to Slack channels. Two delivery methods are available, and the system will use whichever is configured (Bot Token takes priority when both are present).

### Delivery Methods

#### Bot Token (Recommended)

Uses the Slack `chat.postMessage` API to post messages to any channel the bot has been added to. This method enables the **channel picker** in the UI, allowing users to select a destination channel from a dropdown.

| Detail | Value |
|---|---|
| API endpoint | `https://slack.com/api/chat.postMessage` |
| Auth header | `Authorization: Bearer xoxb-...` |
| Env var | `SLACK_BOT_TOKEN` |
| Required scopes | `channels:read`, `chat:write` |

**Channel list** is fetched via `conversations.list` and **cached for 5 minutes** to avoid rate limits. The cache is in-memory on the server (no external cache layer).

#### Webhook (Simpler Fallback)

Posts to a single, pre-configured channel via an Incoming Webhook URL. No channel picker is available in this mode -- all messages go to the channel the webhook was created for.

| Detail | Value |
|---|---|
| Env var | `SLACK_WEBHOOK_URL` |
| Format | `https://hooks.slack.com/services/T.../B.../...` |

When both `SLACK_BOT_TOKEN` and `SLACK_WEBHOOK_URL` are set, the Bot Token method is used. The webhook serves as a fallback if the bot token is missing or if a `chat.postMessage` call fails.

### Channel Allowlist

To prevent users from posting to arbitrary channels, a server-side allowlist restricts which channels appear in the picker.

| Env var | `SLACK_ALLOWED_CHANNELS` |
|---|---|
| Format | Comma-separated channel names (no `#` prefix) |
| Default | `general,meeting-intel,fullfunnel` |

Only channels whose names appear in this list (and that the bot has joined) will be returned to the frontend. If the env var is not set, the three defaults above are used.

### Message Format (Block Kit)

All Slack messages use Slack's Block Kit format for rich layout:

```json
{
  "channel": "C0123456789",
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "Meeting Summary: Q4 Pipeline Review" }
    },
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": "*Key takeaways from the meeting...*\n- Point 1\n- Point 2" }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "View in Dashboard" },
          "url": "https://dashboard.example.com/meetings/abc123"
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": "Sent via Meeting Intelligence Dashboard" }
      ]
    }
  ]
}
```

Structure breakdown:
- **Header block** -- meeting title or action name
- **Section block** -- body content in `mrkdwn` format (Slack's markdown variant)
- **Actions block** -- a button linking back to the dashboard for the relevant meeting
- **Context block** -- footer attribution line

### Where Slack Appears in the UI

Slack integration surfaces in five places:

1. **Draft Email action** -- after generating an email draft, users can send it to Slack instead of copying it
2. **Meeting Prep action** -- share the meeting prep brief to a channel before the meeting
3. **Re-summarization action** -- post an updated summary to Slack after re-summarization
4. **AI Chat (Ask Blarney)** -- any AI chat response can be forwarded to Slack via the send button
5. **Meeting actions dropdown** -- the "Send to Slack" option in the meeting detail page's actions menu

Each of these triggers the `SendToSlack` component (`src/components/shared/SendToSlack.tsx`), which calls `POST /api/actions/slack`.

### Setup Instructions

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App** > **From Scratch**
2. Name the app (e.g., "Meeting Intel Bot") and select your workspace
3. Navigate to **OAuth & Permissions** in the left sidebar
4. Under **Bot Token Scopes**, add:
   - `channels:read` (to list channels for the picker)
   - `chat:write` (to post messages)
5. Click **Install to Workspace** and authorize
6. Copy the **Bot User OAuth Token** (starts with `xoxb-`) from the OAuth page
7. Add the bot to any channels you want it to post to (type `/invite @Meeting Intel Bot` in the channel)
8. Set the environment variable:
   ```
   SLACK_BOT_TOKEN=xoxb-your-token-here
   ```
9. Optionally configure the allowlist:
   ```
   SLACK_ALLOWED_CHANNELS=general,meeting-intel,fullfunnel,sales-team
   ```

For webhook-only setup, skip steps 3-6 and instead:
- Go to **Incoming Webhooks** in the left sidebar, toggle it on
- Click **Add New Webhook to Workspace**, select a channel, and copy the URL
- Set `SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...`

---

## 2. Supabase Auth

Authentication is handled entirely by Supabase using email/password credentials. There is no social login, no magic link, and no self-registration. An admin creates accounts manually in the Supabase dashboard.

### Authentication Flow

1. User visits any protected route
2. Middleware (`src/middleware.ts`) checks for a valid session cookie
3. If no session exists, user is redirected to `/login`
4. User enters email and password
5. Client calls `supabase.auth.signInWithPassword({ email, password })`
6. Supabase returns a session with access and refresh tokens
7. Tokens are stored in HTTP-only cookies via `@supabase/ssr`
8. User is redirected to the original requested route (or `/` by default)

### Client Setup

The Supabase client is created using `@supabase/ssr`'s `createBrowserClient`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

This client handles cookie-based SSR sessions, meaning the session persists across server-side rendering and client-side navigation without extra configuration.

### Middleware Protection

The middleware at `src/middleware.ts` runs on every request and does the following:

1. **Exempts public routes** -- `/login` and `/api/*` routes are not protected (API routes handle their own auth or are internal)
2. **Refreshes the session** -- on every request, the middleware calls `supabase.auth.getUser()` which transparently refreshes the access token if it has expired. This is invisible to the user.
3. **Redirects unauthenticated users** -- if no valid session is found after the refresh attempt, the user is redirected to `/login`

### Access Control

Currently, the dashboard uses a **flat access model**:
- All authenticated users see all data
- There is no role-based access control (RBAC)
- There are no user-specific views or data filtering
- All meetings, scores, and analytics are visible to every logged-in user

### Password Management

- **No password reset flow exists** in the dashboard UI
- Accounts are created by an admin directly in the Supabase dashboard (Authentication > Users > Invite user)
- Password changes must be done by the admin in the Supabase dashboard
- If a user is locked out, the admin must reset their password manually

### Required Environment Variables

| Variable | Visibility | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL (e.g., `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anon/public key (safe to expose) |

The anon key is safe to expose on the client because Row Level Security (RLS) policies on Supabase tables control data access. However, since the dashboard currently does not enforce RLS for meeting data, the anon key effectively grants read access to all meeting data.

---

## 3. n8n Pipeline Contract

The n8n automation platform runs the data ingestion and processing pipeline that feeds the dashboard. The dashboard is a **read-only consumer** of the tables n8n populates. Understanding this contract is critical for maintaining data integrity.

### Workflows

| Workflow | Name | Schedule | Purpose |
|---|---|---|---|
| MI\|0 | Token | On-demand | Refreshes Zoom OAuth token |
| MI\|1 | Capture + Sync | Every 8 hours + weekly full sync | Fetches meetings from Zoom, syncs metadata to Supabase |
| MI\|2 | Transcript + Enrich | Every 8 hours | Downloads transcripts, enriches with HubSpot data |
| MI\|3 | Score | Every 8 hours | Runs AI scoring on meetings, writes scores to `scored_meetings` |
| MI\|4 | Chunk + Embed | Every 8 hours | Chunks transcripts, generates embeddings, writes to `meeting_chunks` |

### Tables n8n Writes To

The following tables are exclusively owned by n8n. The dashboard reads from them but **never writes to them**:

| Table | Written by | Key fields |
|---|---|---|
| `scored_meetings` | MI\|3 (Score) | `meeting_id`, `overall_score`, `scoring_breakdown` (JSONB), `hubspot_contact_id`, `hubspot_company_id` |
| `meeting_chunks` | MI\|4 (Chunk + Embed) | `meeting_id`, `chunk_text`, `embedding` (vector), `chunk_index` |
| `scoring_run_log` | MI\|3 (Score) | `run_id`, `status`, `meetings_scored`, `started_at`, `completed_at` |
| `zoom_users` | MI\|1 (Capture + Sync) | `zoom_user_id`, `email`, `display_name` |

### The Contract

This is the agreement between n8n and the dashboard:

1. **n8n must populate these tables** with the expected JSONB structures. If the schema of `scoring_breakdown` or other JSONB fields changes, the dashboard's parsing logic must be updated to match.
2. **The dashboard never writes** to `scored_meetings`, `meeting_chunks`, `scoring_run_log`, or `zoom_users`. All writes come from n8n.
3. **Schedule awareness** -- the dashboard displays "last synced" timestamps based on when n8n last ran. If the n8n schedule changes, update the `NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS` env var so the dashboard's "stale data" warnings are accurate.
4. **Failure handling** -- if n8n workflows fail, the dashboard will show stale data but will not break. The system health page (`/system-health`) shows pipeline run status from `scoring_run_log`.

### What Happens If n8n Changes

| Change | Impact | Action needed |
|---|---|---|
| Schedule changes | Dashboard "stale data" warnings may fire incorrectly | Update `NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS` |
| JSONB schema changes | Score breakdowns, charts, or detail views may break | Update dashboard parsing logic in relevant components |
| New table added | No impact unless dashboard needs to read it | Add Supabase queries if dashboard should display new data |
| Workflow disabled | Data stops flowing; dashboard shows stale data | System health page will flag the issue |

### Environment Variable

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS` | `8` | Expected interval between n8n pipeline runs (used for staleness checks) |

---

## 4. Anthropic Claude API

Claude is the primary LLM powering all AI features in the dashboard. It is used for RAG-powered chat, email drafting, meeting prep, and re-summarization.

### Configuration

| Detail | Value |
|---|---|
| Model | `claude-sonnet-4-20250514` |
| SDK | `@anthropic-ai/sdk` version `0.82.0` |
| API key env var | `ANTHROPIC_API_KEY` (server-side only, never exposed to client) |

### Usage Across API Routes

| Route | Feature | Max tokens | Streaming |
|---|---|---|---|
| `/api/chat` | Ask Blarney (RAG chat) | 4096 | Yes, via `toReadableStream()` |
| `/api/actions/draft-email` | Draft follow-up email | 1024 | No |
| `/api/actions/meeting-prep` | Pre-meeting brief | 1500 | No |
| `/api/actions/resummarize` | Re-summarize meeting | 1500 | No |

### Streaming vs. Non-Streaming

**Chat (`/api/chat`)** uses streaming to provide a responsive experience. The flow is:
1. User query is embedded via Gemini (see section 5)
2. Vector search retrieves relevant meeting chunks from Supabase
3. Chunks are assembled into a context prompt
4. Claude generates a streamed response via `messages.stream()`
5. The stream is converted to a `ReadableStream` via `toReadableStream()` and returned as a streaming HTTP response

**Action routes** (draft-email, meeting-prep, resummarize) use standard non-streaming requests via `messages.create()`. These return the full response in a single payload, which is acceptable because the responses are shorter and the user expects a brief wait.

### Error Handling

- If `ANTHROPIC_API_KEY` is not set, the API routes return a 500 error with a descriptive message
- If the API call fails (rate limit, server error), the error is caught and returned as a JSON error response
- No automatic retry logic is implemented; the user can retry manually

---

## 5. Google Gemini API

Gemini is used exclusively for generating query embeddings in the RAG chat pipeline. It does not generate text -- only vectors.

### Configuration

| Detail | Value |
|---|---|
| Model | `gemini-embedding-001` |
| Endpoint | `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent` |
| Output dimensions | 768 (reduced from 3072 in v1 for performance) |
| API key env var | `GEMINI_API_KEY` (server-side only) |

### How It Works

When a user sends a message in Ask Blarney (`/api/chat`):

1. The user's query text is sent to the Gemini embedding endpoint
2. Gemini returns a 768-dimension float vector
3. The vector is used in a Supabase RPC call to `match_meeting_chunks` (pgvector cosine similarity search)
4. The top-k matching chunks are returned and assembled into context for Claude
5. Claude generates a response grounded in the retrieved meeting data

### Graceful Fallback

If the Gemini API is unavailable (key missing, API error, timeout), the system degrades gracefully:

- **Vector search is skipped entirely** -- no embedding means no similarity search
- The chat still works, but Claude responds without meeting-specific context (effectively a general-purpose assistant)
- No error is shown to the user; the response quality simply decreases
- A warning is logged server-side for debugging

This design ensures the chat feature never fully breaks due to a Gemini outage.

### Why Gemini for Embeddings?

The embedding model was chosen to match what n8n uses in MI|4 (Chunk + Embed). Both the ingestion pipeline and the query path must use the same embedding model and dimensions to produce compatible vectors for cosine similarity search. Changing the embedding model requires re-embedding all chunks in `meeting_chunks`.

---

## 6. HubSpot (Passive)

The dashboard has a passive relationship with HubSpot -- it reads HubSpot-related data but never calls the HubSpot API directly.

### What Data Exists

Two fields in the `scored_meetings` table store HubSpot identifiers:

| Field | Type | Description |
|---|---|---|
| `hubspot_contact_id` | `text` | HubSpot contact record ID for the meeting's primary attendee |
| `hubspot_company_id` | `text` | HubSpot company record ID for the attendee's organization |

### How the Data Gets There

The n8n enrichment workflow (MI|2 - Transcript + Enrich) calls the HubSpot API during processing:
1. After downloading a meeting transcript, n8n looks up attendee emails in HubSpot
2. If a matching contact is found, n8n writes the `hubspot_contact_id` and `hubspot_company_id` to `scored_meetings`
3. The dashboard then reads these fields when displaying meeting details

### Dashboard Usage

- Meeting detail views may display HubSpot IDs for reference
- Company grouping logic can use `hubspot_company_id` for deduplication
- No HubSpot links are generated in the UI currently (IDs are stored but not linked out)

### Future Possibilities

- Push meeting scores back to HubSpot deal properties (would require adding a HubSpot API key and write logic)
- Link out to HubSpot contact/company records from the meeting detail page
- Pull deal stage data from HubSpot for pipeline correlation analysis

---

## 7. Environment Variable Reference

Complete list of all integration-related environment variables:

| Variable | Required | Visibility | Integration | Description |
|---|---|---|---|---|
| `SLACK_BOT_TOKEN` | No* | Server | Slack | Bot OAuth token (`xoxb-...`) for chat.postMessage |
| `SLACK_WEBHOOK_URL` | No* | Server | Slack | Incoming webhook URL (fallback) |
| `SLACK_ALLOWED_CHANNELS` | No | Server | Slack | Comma-separated channel allowlist (default: `general,meeting-intel,fullfunnel`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client + Server | Supabase | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client + Server | Supabase | Anon/public API key |
| `ANTHROPIC_API_KEY` | Yes | Server | Claude | Anthropic API key for LLM calls |
| `GEMINI_API_KEY` | Yes | Server | Gemini | Google API key for embeddings |
| `NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS` | No | Client | n8n | Expected pipeline run interval (default: `8`) |

*At least one of `SLACK_BOT_TOKEN` or `SLACK_WEBHOOK_URL` must be set for Slack features to work.

### Visibility Notes

- **Server-only** variables (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `SLACK_BOT_TOKEN`, `SLACK_WEBHOOK_URL`) are never sent to the browser. They are only accessible in API routes and server components.
- **Client + Server** variables (prefixed with `NEXT_PUBLIC_`) are embedded in the JavaScript bundle at build time and are visible to anyone inspecting the frontend. Only non-secret values should use this prefix.
