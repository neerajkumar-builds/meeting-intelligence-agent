# Meeting Intelligence Dashboard — Architecture

## System Overview

```
Zoom  -->  n8n (5 workflows, 8hr cycle)  -->  Supabase  -->  Next.js Dashboard  -->  User
                                                  |
                                            meeting_chunks  -->  RAG Search (Gemini embeddings + Claude)
```

**Pipeline**: Zoom recordings are captured, transcribed, enriched, scored by 4 LLMs, chunked and embedded — all orchestrated by n8n running on an 8-hour cycle.

**Dashboard**: A Next.js 16 app that reads scored meeting data from Supabase and provides team scorecards, meeting detail views, company intelligence, and an AI-powered search interface.

## Tech Stack

- **Framework**: Next.js 16.2.2 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui, Recharts
- **Auth**: Supabase Auth (email/password, cookie-based via @supabase/ssr)
- **Data**: Supabase (PostgreSQL, JSONB scoring fields, pgvector for RAG)
- **AI**: Anthropic Claude (RAG chat, email drafting, summarization), Google Gemini (embeddings)
- **Testing**: Vitest, @testing-library/react
- **Deployment**: Vercel

## Routes (17 total)

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Static | Team Scorecard — KPIs, charts, insights, rep table |
| `/login` | Static | Email/password login |
| `/meetings` | Static | Meeting feed with filters (rep, stage, company, period) |
| `/meetings/[id]` | Dynamic | Meeting detail — scores, coaching, transcript, Company Intelligence Sidebar |
| `/meetings/[id]/print` | Dynamic | A4 print report |
| `/companies` | Static | Company card grid with search |
| `/companies/[name]` | Dynamic | Company detail — timeline, health chart, Company Intelligence Sidebar |
| `/reps/[name]` | Dynamic | Rep profile — gauge, trend, stage donut, meetings |
| `/search` | Static | RAG AI Search with streaming, charts, copy/email/Slack |
| `/health` | Static | System overview — pipeline sync, service status, metrics |
| `/api/chat` | Function | RAG pipeline (embed → vector search → Claude streaming) |
| `/api/actions/draft-email` | Function | Generate follow-up emails (3 templates) |
| `/api/actions/resummarize` | Function | Re-summarize meetings (4 formats) |
| `/api/actions/meeting-prep` | Function | Pre-call briefing from past meetings |
| `/api/companies/[name]/intelligence` | Function | Company Intelligence aggregation (7 sections) |
| `/api/notifications/slack` | Function | Send to Slack via webhook |

## Data Model (Supabase)

### `meetings_list` (view)
Lightweight view for feeds and scorecards: id, topic, host_name, company_name, scoring_stage_type, start_time, duration_minutes, overall_score, client_health_score, meeting_summary.

### `scored_meetings` (table)
Full records with JSONB score fields:
- **All stages**: `rep_score` (strengths, areas_for_improvement, coaching_recommendations, blind_spots)
- **Discovery**: `meeting_score` (lead_score, deal_sentiment, next_actionables, tentative_closure_date), `icp_score` (icp_fit_score, alignment/misalignment signals)
- **Follow-up**: `engagement_score` (engagement_level, churn_risk_signals, expansion_signals, relationship_health)
- **Onboarding**: `delivery_score` (delivery_status, blockers, milestones, current_phase)
- **Internal**: `internal_summary` (action_items[], decisions_made[], client_references[], quality metrics)

### `meeting_chunks` (table)
Transcript chunks with pgvector embeddings for RAG search. Metadata includes meeting_id, company_name, host_name, topic.

### `scoring_run_log` (table)
n8n workflow execution logs with timestamps.

## n8n Pipeline (8-hour cycle)

| Workflow | ID | Schedule |
|----------|----|----------|
| MI\|0 — Token Service (Zoom S2S) | ENm8w8yEJGxL0yZT | On-demand |
| MI\|1 — Capture Meetings + Sync Users | rBi3GeFd5MBkHX5W | 8hr + Weekly |
| MI\|2 — Transcript + Enrich | Eo6HPUD58cQc4miB | 8hr |
| MI\|3 — Score Meetings (4-LLM) | AQcneXfRxHdZICeZ | 8hr |
| MI\|4 — Chunk + Embed (RAG) | TCrG2S41dfp0kjZV | 8hr |

## Key Features

### Company Intelligence Sidebar
Aggregates cross-meeting data into 7 sections: Health Pulse, Stakeholders, Deal Status, Risk Signals, Open Actions, Competitor Mentions, MEDDIC Gap Analysis. Appears on company detail and meeting detail pages. Responsive: aside on desktop, bottom Sheet on mobile.

### RAG AI Search
3-layer context: meeting scores → vector-searched transcript chunks → JSONB coaching/intelligence. Supports inline chart rendering (bar, donut, line) in responses.

### Pipeline Sync Status
Header indicator showing last sync time (from Supabase MAX(scored_at)), pending meeting count, and next sync estimate. Detailed view on System page.

### Send to Slack
"Send to Slack" button on draft emails, meeting prep, resummarized notes, and AI Search responses. Posts via Slack webhook with Block Kit formatting.

## Testing

- **Framework**: Vitest + @testing-library/react
- **Test count**: 77 tests across 13 files
- **Coverage areas**: Utilities (format, stage, constants), API routes (chat, draft-email, slack, intelligence), middleware auth logic, shared components (ScoreBadge, StageTypeBadge, EmptyState, SendToSlack, SyncIndicator)
- **Run**: `npm test` / `npm run test:watch` / `npm run test:coverage`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `ANTHROPIC_API_KEY` | Claude API for RAG chat and actions |
| `GEMINI_API_KEY` | Gemini API for embeddings |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook (optional) |
