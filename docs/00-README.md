# Meeting Intelligence Dashboard — Documentation

## What Is This?

The Meeting Intelligence Dashboard is FullFunnel's internal web application that transforms raw Zoom meeting recordings into actionable sales intelligence. It scores meetings using AI, coaches reps, tracks account health, detects competitors, and provides a conversational AI assistant ("Ask Blarney") for querying across all meeting data.

Built for FullFunnel's team of 10-15 users (CEO, CRO, sales reps, GTM engineers), it surfaces the insights that matter — who's performing, which accounts need attention, and what coaching will move the needle.

## Deployed At

- **Production:** https://dashboard-chi-blue-6ybimqrfjv.vercel.app
- **GitHub:** https://github.com/say2neeraj/fullfunnel-meeting-intel (private)
- **Supabase Project:** cxrjlmquzhfueqrudiuy

## How This System Works (Big Picture)

```
Zoom Meetings
     │
     ▼
n8n Workflows (6 pipelines)
├── MI|0: Token Service (Zoom OAuth refresh)
├── MI|1: Capture Meetings + Sync Users (8hr + Weekly)
├── MI|2: Transcript + Enrich (8hr)
├── MI|3: Score Meetings with 4-LLM pipeline (8hr)
└── MI|4: Chunk + Embed for RAG (8hr)
     │
     ▼
Supabase (PostgreSQL + pgvector)
├── scored_meetings (76 meetings, JSONB scores)
├── meeting_chunks (611 chunks, vector embeddings)
├── meetings_list (lightweight view)
├── scoring_run_log (pipeline observability)
└── zoom_users (rep configuration)
     │
     ▼
Next.js Dashboard (this codebase)
├── 10 page routes (scorecard, meetings, companies, reps, search, health, login)
├── 9 API routes (chat, actions, intelligence, analytics, slack, notes)
├── AI-powered: Claude Sonnet 4 (chat, emails, prep) + Gemini (embeddings)
└── Deployed on Vercel
```

**Important boundary:** The n8n backend and the Next.js dashboard are completely independent. The dashboard READS from Supabase tables that n8n WRITES to. The dashboard never modifies n8n's tables. The only tables the dashboard writes to are `chat_analytics` and `meeting_notes` — both created by the dashboard itself.

## Document Reading Order

Read these in sequence for full understanding:

| # | Document | What You'll Learn | Who Should Read |
|---|----------|------------------|-----------------|
| 1 | **[01-tech-stack.md](01-tech-stack.md)** | Technology choices, dependencies, why each was chosen | Engineers |
| 2 | **[02-setup-guide.md](02-setup-guide.md)** | How to set up locally, deploy, configure | Engineers |
| 3 | **[03-database-schema.md](03-database-schema.md)** | All 7 tables, JSONB structures, what n8n owns vs. dashboard | Engineers |
| 4 | **[04-features.md](04-features.md)** | Every feature, page by page, with what/why/how | Everyone |
| 5 | **[05-ai-rag-system.md](05-ai-rag-system.md)** | Ask Blarney: RAG pipeline, prompts, tuning guide | Engineers, AI team |
| 6 | **[06-api-reference.md](06-api-reference.md)** | Every API endpoint, request/response formats | Engineers |
| 7 | **[07-integrations.md](07-integrations.md)** | Slack, Auth, n8n pipeline, external APIs | Engineers, Ops |
| 8 | **[08-testing.md](08-testing.md)** | Test framework, 77 tests, how to run/add tests | Engineers |
| 9 | **[09-version-history.md](09-version-history.md)** | V1.0 through V1.3 changelog | Everyone |
| 10 | **[10-corner-cases.md](10-corner-cases.md)** | Known limitations, safety rules, edge cases | Engineers, Ops |
| 11 | **[11-replication-guide.md](11-replication-guide.md)** | Step-by-step: deploy for another customer | GTM Engineers |
| 12 | **[12-project-origin.md](12-project-origin.md)** | How the project started, decisions, learnings | Leadership, New team members |

## Quick Reference

**Current Version:** V1.3 (April 4, 2026)

**Key Numbers:**
- 76 scored meetings
- 611 embedded transcript chunks
- 28 companies tracked
- 5 sales reps monitored
- 77 automated tests
- 10 page routes + 9 API routes
- 4 meeting stage types (Discovery, Follow-Up, Onboarding, Internal)

**Key Features:**
- Team Scorecard with KPI cards, rep comparison, sparkline trends
- Meeting Feed with multi-filter (rep, stage, company, date range)
- Meeting Detail with stage-specific scores, coaching, intelligence tabs
- Company Intelligence Sidebar (7 dimensions: health, stakeholders, deals, risks, actions, competitors, MEDDIC)
- Ask Blarney (RAG chat with charts, source citations, follow-up suggestions)
- Slack Integration (channel picker, Block Kit messages)
- Chat Analytics (query logging, thumbs up/down, rate limiting)
- Meeting Notes (section-level, persistent, multi-user)
- Chart Downloads (PNG export with title + legend)
- Pipeline Sync Monitoring (last sync, next estimate, pending count)
- Notification Bell (at-risk accounts, coaching alerts, pipeline status)
