# Replication Guide: Deploying Meeting Intelligence Dashboard for a New Customer

This is the step-by-step playbook for GTM engineers deploying the Meeting Intelligence Dashboard to a new customer environment. Follow every step in order. Do not skip the verification checklist at the end.

---

## Prerequisites Checklist

Before starting, confirm the following are in place:

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] Supabase account with a project created
- [ ] pgvector extension enabled in Supabase
- [ ] Anthropic API key (claude-sonnet-4 access)
- [ ] Google Gemini API key
- [ ] Vercel account connected to GitHub
- [ ] n8n instance with Meeting Intelligence workflows configured
- [ ] Zoom OAuth app (for meeting capture)
- [ ] Slack workspace + app (optional, for notifications)

---

## Step 1: Supabase Setup

### 1.1 Create the Supabase Project

Create a new project at [supabase.com](https://supabase.com). Note these values immediately -- you will need them for every subsequent step:

- **Project URL:** `https://<project-ref>.supabase.co`
- **Anon Key:** found in Settings > API > Project API keys

### 1.2 Enable pgvector

In the SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This is required for the RAG embedding search to work.

### 1.3 Create Tables That n8n Writes To

These tables are owned by the n8n pipeline. The dashboard only reads from them.

**scored_meetings** -- the core table. Each row is one scored meeting with JSONB score data and full transcript.

```sql
CREATE TABLE scored_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_uuid TEXT UNIQUE NOT NULL,
  topic TEXT,
  start_time TIMESTAMPTZ,
  duration INTEGER,
  host_email TEXT,
  host_name TEXT,
  account_name TEXT,
  participant_emails TEXT[],
  transcript TEXT,
  scores JSONB,
  scoring_stage TEXT,
  scored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**meeting_chunks** -- vector-embedded chunks for RAG search.

```sql
CREATE TABLE meeting_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_uuid TEXT NOT NULL,
  chunk_index INTEGER,
  content TEXT,
  embedding VECTOR(768),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON meeting_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**scoring_run_log** -- pipeline observability (used by the System Health page).

```sql
CREATE TABLE scoring_run_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT,
  status TEXT,
  meetings_processed INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);
```

**zoom_users** -- rep configuration (synced by MI|1 workflow).

```sql
CREATE TABLE zoom_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  status TEXT,
  synced_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.4 Create the Lightweight View

The `meetings_list` view strips heavy columns (transcript, full JSONB scores) so list pages load fast. Without this view, every list query would pull 23K+ characters of transcript per row.

```sql
CREATE VIEW meetings_list AS
SELECT
  id,
  meeting_uuid,
  topic,
  start_time,
  duration,
  host_email,
  host_name,
  account_name,
  participant_emails,
  scoring_stage,
  scored_at,
  scores->>'overall_score' AS overall_score,
  created_at
FROM scored_meetings;
```

### 1.5 Create Dashboard-Owned Tables

These tables are written to by the dashboard, not n8n.

**chat_analytics** -- tracks Ask Blarney usage (queries, feedback, response times).

```sql
CREATE TABLE chat_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  query TEXT,
  response_length INTEGER,
  sources_count INTEGER,
  response_time_ms INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**meeting_notes** -- section-level notes added by users on meeting detail pages.

```sql
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_uuid TEXT NOT NULL,
  section TEXT NOT NULL,
  content TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.6 Create the RPC Function for RAG Search

This is the vector similarity search function called by the Ask Blarney API route.

```sql
CREATE OR REPLACE FUNCTION match_meeting_chunks(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  meeting_uuid TEXT,
  chunk_index INTEGER,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id,
    mc.meeting_uuid,
    mc.chunk_index,
    mc.content,
    mc.metadata,
    1 - (mc.embedding <=> query_embedding) AS similarity
  FROM meeting_chunks mc
  WHERE 1 - (mc.embedding <=> query_embedding) > match_threshold
  ORDER BY mc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 1.7 Set Up Row Level Security (RLS)

Enable RLS on all tables and create policies that allow authenticated users to read/write as needed. At minimum:

```sql
-- Enable RLS
ALTER TABLE scored_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_run_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoom_users ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users (all tables)
CREATE POLICY "Authenticated users can read scored_meetings"
  ON scored_meetings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read meeting_chunks"
  ON meeting_chunks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read scoring_run_log"
  ON scoring_run_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read zoom_users"
  ON zoom_users FOR SELECT TO authenticated USING (true);

-- Dashboard-owned tables: read + write for authenticated users
CREATE POLICY "Authenticated users can manage chat_analytics"
  ON chat_analytics FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage meeting_notes"
  ON meeting_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- n8n service role needs write access to its tables.
-- The service_role key bypasses RLS, so no additional policies are needed for n8n.
```

### 1.8 Create Auth Users

In the Supabase dashboard, go to Authentication > Users and create accounts for each dashboard user (email + password). These are the credentials they will use to log in.

---

## Step 2: n8n Pipeline

The n8n Meeting Intelligence Engine must be running and populating data before the dashboard is useful.

### 2.1 Deploy the 6 Workflows

| Workflow | Purpose | Schedule |
|----------|---------|----------|
| MI\|0 | Zoom OAuth token refresh | Runs as needed |
| MI\|1 | Capture meetings + sync users | Every 8 hours + weekly user sync |
| MI\|2 | Transcript download + enrichment | Every 8 hours |
| MI\|3 | Score meetings with 4-LLM pipeline | Every 8 hours |
| MI\|4 | Chunk + embed for RAG | Every 8 hours |

There is also a MI\|5 workflow for ad-hoc operations (not scheduled).

### 2.2 Configure Credentials in n8n

- **Zoom OAuth** -- client ID, client secret, redirect URI from the Zoom OAuth app
- **Supabase** -- project URL and **service_role** key (not anon key; n8n needs write access that bypasses RLS)
- **LLM API keys** -- as required by the scoring prompts in MI|3

### 2.3 Configure Scoring Prompts

MI|3 contains the scoring logic. Review and adjust the LLM prompts for the customer's specific:
- Sales methodology
- Scoring criteria per stage
- Company-specific terminology

### 2.4 Set Schedules

Default is every 8 hours. Adjust based on the customer's meeting volume. Higher volume may need shorter intervals; lower volume can use longer intervals (12h or 24h).

### 2.5 Run Initial Sync

Activate the workflows and trigger MI|1 manually to do the first meeting capture. Then trigger MI|2 through MI|4 in sequence. Wait for each to complete before triggering the next.

### 2.6 Verify Pipeline Output

Confirm data exists in Supabase:

```sql
-- Should return rows after MI|3 completes
SELECT COUNT(*) FROM scored_meetings;

-- Should return rows after MI|4 completes
SELECT COUNT(*) FROM meeting_chunks;

-- Should show successful runs
SELECT * FROM scoring_run_log ORDER BY completed_at DESC LIMIT 5;
```

If these are empty, do not proceed to Step 3. Debug the pipeline first.

---

## Step 3: Dashboard Deployment

### 3.1 Clone the Repository

```bash
git clone https://github.com/say2neeraj/fullfunnel-meeting-intel.git
cd fullfunnel-meeting-intel
```

### 3.2 Create Environment Variables

Copy the example file and fill in the customer's values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with the customer's credentials:

```env
# Supabase (from Step 1)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# AI APIs
ANTHROPIC_API_KEY=<anthropic-api-key>
GEMINI_API_KEY=<gemini-api-key>

# Slack (optional)
SLACK_BOT_TOKEN=<xoxb-bot-token>
SLACK_WEBHOOK_URL=<webhook-url>
SLACK_ALLOWED_CHANNELS=<comma-separated-channel-names>

# Pipeline sync indicator
NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS=8

# Rate limiting for Ask Blarney
DAILY_QUERY_LIMIT=50
BURST_QUERY_LIMIT=10
```

### 3.3 Verify Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Confirm:
- Login page loads
- You can sign in with a Supabase auth user
- Scorecard page shows meetings from scored_meetings
- Ask Blarney returns answers

### 3.4 Deploy to Vercel

1. Push the repository to the customer's GitHub (or a dedicated branch/fork)
2. In Vercel, click "New Project" and import the repository
3. Framework preset: **Next.js** (auto-detected)
4. Add **all** environment variables from `.env.local` to the Vercel project settings (Settings > Environment Variables)
5. Deploy

### 3.5 Verify Production

After deployment completes, visit the production URL and repeat the local verification checks. Pay special attention to:
- API routes returning data (not 500 errors)
- Ask Blarney finding relevant chunks (confirms Gemini embedding + Supabase vector search work in production)
- Slack send reaching the correct channel

---

## Step 4: Customization

### 4.1 Branding

**Colors:** Edit `src/app/globals.css` lines 50-51:

```css
--color-ff-blue: #146DFA;   /* Primary accent -- change to customer's brand color */
--color-ff-black: #0A0A0A;  /* Dark background -- usually stays */
```

**Logo:** Replace these files in `public/`:
- `fullfunnel-logo.svg` -- dark background logo (used in sidebar)
- `fullfunnel-logo-white.svg` -- light/white version
- `favicon.svg` -- browser tab icon

### 4.2 Tracked Vendors

Edit `src/lib/constants.ts` -- the `TRACKED_VENDORS` array (line 70+). These are the competitor/vendor names the system watches for in meeting transcripts.

```typescript
export const TRACKED_VENDORS = [
  "Competitor A",
  "Competitor B",
  // Add customer's competitive landscape
];
```

### 4.3 Scoring Stage Types

If the customer uses different pipeline stages than the default (e.g., different from Discovery, Demo, Negotiation), update both:

1. `ScoringStageType` type (line 1 of `src/lib/constants.ts`)
2. `STAGE_CONFIG` record (line 7 of `src/lib/constants.ts`) -- labels, colors, and display order

This also requires matching changes in the n8n MI|3 scoring prompts.

### 4.4 Slack Channels

Set `SLACK_ALLOWED_CHANNELS` in the environment variables. This is a comma-separated list of channel names that users can send to from the dashboard. Example:

```
SLACK_ALLOWED_CHANNELS=meeting-intelligence,sales-alerts,leadership-digest
```

### 4.5 Rate Limits

Adjust in environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DAILY_QUERY_LIMIT` | 50 | Max Ask Blarney queries per user per day |
| `BURST_QUERY_LIMIT` | 10 | Max queries in a short burst window |

### 4.6 Pipeline Interval

`NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS` controls the sync freshness indicator on the dashboard. Set it to match the n8n schedule interval. If n8n runs every 12 hours, set this to `12`.

---

## Step 5: Verification Checklist

Run through every item. If any fail, fix before handing off to the customer.

- [ ] Login page loads with customer branding
- [ ] Authentication works (sign in, sign out, session persists on refresh)
- [ ] Scorecard shows meetings and KPI cards with real data
- [ ] Meeting list loads without timeout (confirms meetings_list view is working)
- [ ] Meeting detail shows stage-specific scores across all tabs
- [ ] Ask Blarney returns relevant answers with source citations
- [ ] Ask Blarney source citations link to real meeting detail pages
- [ ] Slack send works to allowed channels (if Slack configured)
- [ ] Chart downloads produce PNGs with titles and legends
- [ ] Meeting notes save and persist across page reloads
- [ ] Company page lists accounts with meeting counts
- [ ] Rep Profile page shows individual rep stats
- [ ] System Health page shows correct last-sync time and pipeline status
- [ ] Sync indicator in sidebar reflects actual n8n run times

---

## What Changes vs. What Stays the Same

### Always Change Per Customer

| Item | Where |
|------|-------|
| Supabase project URL + keys | `.env.local` / Vercel env vars |
| Anthropic API key | `.env.local` / Vercel env vars |
| Gemini API key | `.env.local` / Vercel env vars |
| Slack bot token + webhook + channels | `.env.local` / Vercel env vars |
| Branding colors | `src/app/globals.css` |
| Logo SVGs | `public/` |
| Tracked vendors | `src/lib/constants.ts` |
| Supabase auth users | Supabase dashboard |
| n8n credentials (Zoom, Supabase, LLMs) | n8n instance |

### Never Change

| Item | Reason |
|------|--------|
| All source code in `src/` | Shared codebase across deployments |
| Component structure | Tested and stable |
| API route logic | Works generically with any Supabase data |
| RAG pipeline logic | Model-agnostic, schema-driven |
| `match_meeting_chunks` RPC | Standard vector search interface |

### Change Only If Needed

| Item | When |
|------|------|
| `ScoringStageType` + `STAGE_CONFIG` | Customer uses different pipeline stages |
| Rate limits | Customer has different usage patterns |
| Pipeline interval | n8n schedule differs from 8-hour default |
| RLS policies | Customer needs per-user data isolation |

---

## Troubleshooting

### Dashboard loads but shows no data
- Verify n8n pipeline has run successfully (check `scoring_run_log`)
- Confirm `scored_meetings` has rows
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check browser console for Supabase auth errors

### Ask Blarney returns "no relevant information found"
- Confirm `meeting_chunks` has rows (MI|4 must have run)
- Verify `GEMINI_API_KEY` is valid (used for query embedding)
- Test the `match_meeting_chunks` RPC directly in Supabase SQL Editor
- Check that the pgvector index was created

### Slack send fails
- Confirm `SLACK_BOT_TOKEN` is set and the bot is invited to the target channels
- Verify channel names in `SLACK_ALLOWED_CHANNELS` match exactly (case-sensitive)
- Check Vercel function logs for the `/api/notifications/slack` route

### Charts show but downloads are blank
- This is usually a CORS issue with external fonts. Verify the deployment domain is not blocking font loading.
- Chart download captures HTML elements (titles, legends) in addition to the SVG. If CSS is stripped, the capture breaks.

### Sync indicator always shows "stale"
- Check that `NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS` matches the actual n8n schedule
- Verify `scoring_run_log` has recent entries with `status = 'success'`
