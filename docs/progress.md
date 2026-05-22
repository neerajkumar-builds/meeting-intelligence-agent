# Prism Dashboard (formerly Meeting Intelligence) - Progress

## Current State
- **Status:** Sprint 1-4 deployed. Score-0 cascade fix + Prism rebrand deployed. Pipeline flowing.
- **Last session:** 2026-05-22 (Session 5: score-0 fix, Prism rename, pipeline triggers fix, notification frequency fix)
- **Branch:** `main`, production in sync
- **Production URL:** https://dashboard-jet-seven-93.vercel.app (company Vercel, auto-deploy from GitHub)
- **Dev:** localhost:3003 - Supabase burcfsxsxgabknmodsrd (MI tables + 42 meetings)
- **Deploy method:** Auto-deploy via Vercel GitHub App on push to main (neerajkumar-builds org)
- **Tests:** 91 passing (17 test files, Vitest)
- **Stack:** Next.js 16.2.2, React 19, Supabase, Anthropic SDK 0.82+, Tailwind v4
- **Stage types:** 6 (discovery_scoping, follow_up, onboarding, client_meeting, internal_client_meeting, internal) - ALL now actively assigned
- **Supabase prod:** RLS DISABLED on scored_meetings (fix for n8n pipeline), scoring_config v2, notification_preferences, detect_pipeline_triggers(), user_roles email UNIQUE
- **Supabase dev:** Full MI schema + 42 meetings (11 seed + 31 migrated from prod)
- **n8n prod:** MI|2 updated (8-theme AI prompt), MI|3 updated (host-role-aware classification + Read Zoom Users node)
- **Zoom users:** 17 enabled across 7 classifications (sales_rep, cs, pm, engineering, marketing, revops, leadership)
- **Slack channels:** #mi-sales, #mi-cs, #mi-internal (Prism digest format live)
- **Vercel Cron:** Mon 8am / Tue-Thu 8am / Fri 4pm EST digests active
- **Git remote:** `production` only
- **Full context:** See `migration/session-handover.md`

## Backlog
- [x] Sprint 1: Add 2 new stage types + RLS + scoring_config (DONE 2026-05-13)
- [x] Sprint 2: CR-012 CS Scoring Framework (DONE 2026-05-13)
- [x] Sprint 2: CR-013 Internal Scoring Enhancement (DONE 2026-05-13)
- [x] Dev GitHub remote (say2neeraj) removed
- [x] Sprint 3: CR-011 Notification + Digest System (digest engine + settings UI + Slack channels deployed)
- [x] Sprint 3: CR-015 Pipeline Trigger Alerts (SQL function + API deployed to prod)
- [x] Company intelligence CS extraction (deployed to prod)
- [ ] Sprint 3: CR-014 HubSpot Score Writeback (blocked: needs API key with write perms)
- [ ] Sprint 4: CR-010 Teams Recording Capture MVP (blocked: needs Azure AD credentials)
- [ ] Deferred: CR-016 Modular Pricing
- [x] Monitor first real client_meeting/internal_client_meeting scoring from n8n (DONE 2026-05-18 - 9 client_meeting + 1 internal_client_meeting)
- [x] RLS on scored_meetings disabled (was blocking n8n pipeline since May 12) (DONE 2026-05-18)
- [x] 17 users enabled with 7 classifications (was 5 sales_rep only) (DONE 2026-05-18)
- [x] MI|2 AI prompt updated with client_meeting + internal_client_meeting themes (DONE 2026-05-18)
- [x] MI|3 Build Scoring Context updated with host-role-aware classification (DONE 2026-05-18)
- [x] MI|3 Read Zoom Users node added for host classification lookup (DONE 2026-05-18)
- [x] Slack digests upgraded to Prism vision (deal context, pipeline alerts, investment tracking) (DONE 2026-05-19)
- [ ] Wire n8n MI|3 to POST real-time trigger after scoring
- [ ] Re-enable RLS with proper INSERT/UPDATE policies (service_role key in n8n)
- [x] Digest engine reads notification_preferences before sending (DONE 2026-05-13 Session 3)
- [x] Env validation for CRON_SECRET, MI_*_CHANNEL_ID, SUPABASE_SERVICE_ROLE_KEY (DONE)
- [x] Schema docs for notification_preferences, detect_pipeline_triggers, client_meeting JSONB (DONE)
- [x] Tests for digest, triggers, preferences routes (11 new tests, DONE)
- [x] Teams capture scaffold (teams-capture/ folder with full TypeScript project, DONE)
- [ ] Email delivery via Resend (notification_preferences supports it, backend not wired)
- [ ] Personal Slack DMs removed from roadmap (user decision: channels only, no DMs)

## Session Log

### 2026-05-22 (Session 5) - Score-0 Cascade Fix + Prism Rebrand

**Deep scan findings:**
- 7 client_meeting scoring_failed (14% failure rate) - MI|3 Score CS LLM returning non-JSON
- All 7 were LATEST meeting for their companies, poisoning pipeline triggers, at-risk alerts, health trends
- Digest route had no status filter - showed scoring_failed as 0/10 in Slack
- `detect_pipeline_triggers()` SQL had no status filter - generated false deal_slipping for 7 companies
- Internal section notification frequency was 'weekly' - missed all Tue-Thu digests since May 18
- Product officially renamed to "Prism" (confirmed in Granola NH Office meeting May 19)
- No duplicates from 6-day batch reprocessing (on_conflict=meeting_uuid prevents)

**Fixes applied (Phase 1):**
- Added `.eq("status", "completed")` to digest main query and stale deals query
- Updated `detect_pipeline_triggers()` SQL on dev + prod with `AND sm.status = 'completed'`
- Changed internal notification_preferences frequency from 'weekly' to 'daily'
- Renamed "Meeting Intelligence" to "Prism" across 9 files (layout, login, settings, digest, slack, chat, print, search)
- Updated digest test mock for new query chain

**Verified:**
- 7 poisoned companies no longer in pipeline triggers
- All notification preferences set to daily + active
- TypeScript: 0 errors, Tests: 91/91, Build: success
- CLAUDE.md, MEMORY.md, progress.md updated with current state

**n8n changes pending (Phase 2 - Neeraj manual):**
- Score CS prompt hardening (JSON-only instruction block)
- Process Scores JSON repair fallback (regex extraction for known keys)
- Re-score 7 failed meetings after fix

**Parked:**
- Phase 3: anon key to service_role key swap in n8n HTTP nodes
- Phase 4: RLS re-enable (deferred, too risky without Phase 3 proven stable)

### 2026-05-18/19 (Session 4) - Pipeline Fix + Classification Upgrade + Prism Digests

**Pipeline data flow restored:**
- Root cause: RLS on scored_meetings (applied Sprint 1) had no INSERT policy for anon role. n8n uses anon key for HTTP POST. RLS silently blocked all writes since May 12.
- Fix: Disabled RLS on scored_meetings. Pipeline immediately captured 112 new meetings.
- Future: Re-enable RLS with service_role key in n8n workflows (Option 2 from analysis).

**17 users enabled (was 5):**
- Updated zoom_users table with 7 classifications: sales_rep (2), cs (3), pm (4), engineering (3), leadership (3), marketing (1), revops (1)
- All enabled_for_scoring = true
- Leadership privacy rule discussed (Stephen+Matthew only meetings) - not yet implemented

**n8n classification upgrade (4 node changes across 2 workflows):**
- MI|2 "AI Extract & Summarize": Added client_meeting + internal_client_meeting to 8-theme prompt
- MI|2 "Is Internal?": Verified exact match (equals, not contains) - no change needed
- MI|3 "Read Zoom Users": NEW Supabase node, reads classification per host
- MI|3 "Build Scoring Context": Host-role-aware logic. CS host + external = client_meeting. Executed in series (Read Zoom Users -> Read Enriched Meetings with Execute Once).
- Result: 9 client_meeting + 1 internal_client_meeting scored (first time ever)

**Prism digest upgrade (ad89e67):**
- Monday: "What to Focus On" - deals to watch (slipping/accelerating/stale), ICP quality, at-risk accounts, team focus
- Tue-Thu: deal sentiment, next action items from meeting_score JSONB, churn risk flags
- Friday: "Weekly Investment Summary" - hours per rep, high-quality/needs-work counts, account health, coaching insight
- Data sources: meeting_score, rep_score, icp_score JSONB + detect_pipeline_triggers() RPC + stale deals query

**Architecture sheet gap analysis (Luke's request):**
- Compared all 4 pages (Scorecard, Meetings, Companies, Reps) against Luke's architecture sheet
- 18 DONE, 6 PARTIAL, 8 MISSING items documented
- Response sent to Luke with full status breakdown
- Key gaps: Avg ICP Score KPI, Hot Deals KPI, BANT summary, Company Status tracking, Objection/Alignment mentions

**Teams capture scaffold (from Session 3, refined):**
- Fixed 3 critical issues: no "list all meetings" API, getStream() type, MSAL version
- Correct approach: calendarView + getAllTranscripts APIs
- VTT + metadataContent parsers added
- Needs Azure AD credentials to test

**Matt's feedback captured:**
- Prism product vision: "Replace Monday morning management call"
- Slack digests should be automated sales manager
- Deal progression, pipeline velocity, investment ROI focus
- Competitive positioning vs Gong: "complete investment visibility"

**Commits:** 9d1abb3 (gap fixes), ad89e67 (Prism digest)
**n8n changes:** MI|2 prompt + MI|3 classification (not in git - n8n workflow changes)

### 2026-05-13 (Session 3) - Gap Fixes + Tests + Teams Scaffold

**Self-review gaps fixed (5):**
- CRITICAL: Added CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY, MI_*_CHANNEL_ID to .env.example + validate-env.mjs + environments.md
- CRITICAL: Wired digest engine to query notification_preferences before sending (shouldSkipSection logic)
- HIGH: Updated docs/03-database-schema.md with notification_preferences, detect_pipeline_triggers, scoring_config, client_meeting JSONB
- MEDIUM: Added 11 new tests across 3 files (digest, triggers, preferences routes)
- MEDIUM: Documented client_meeting meeting_score JSONB structure

**Notification preference wiring:**
- Digest route now calls shouldSkipSection() per section
- Queries notification_preferences for is_active + frequency
- Default-open: sends if no preferences exist (backward compatible)
- Skips section only if ALL prefs inactive or frequency mismatch

**Teams capture scaffold (separate from dashboard):**
- Full TypeScript project at ../teams-capture/ (outside dashboard git repo)
- @azure/msal-node + @microsoft/microsoft-graph-client
- 6 source files: config, auth, graph-client, list-users, list-meetings, index
- Ready to test when Azure AD credentials arrive
- Needs: Application Access Policy (PowerShell) + admin consent

**Decisions:**
- NO personal Slack DMs - channels only (#mi-sales, #mi-cs, #mi-internal)
- Teams integration completely isolated from MI dev/prod
- Default-open notification preference pattern (no prefs = send)

**Commits:** 9d1abb3
**Tests:** 91/91 (was 80, +11 new)

### 2026-05-13 (Session 2) - Sprint 3: Notifications + CS Intelligence + Pipeline Triggers

**Notification system (CR-011):**
- Digest engine: Mon priorities, Tue-Thu actions, Fri review - sends to section channels
- 3 Slack channels: #mi-sales (C0B32H6C0SK), #mi-cs (C0B3BKT18P5), #mi-internal (C0B32HBD1M5)
- Vercel Cron: vercel.json with 3 schedules (UTC 13:00 Mon, 13:00 Tue-Thu, 21:00 Fri)
- Real-time trigger POST endpoint for n8n webhook (not wired yet)
- notification_preferences table on prod with RLS
- Settings UI at /settings: frequency, thresholds, channel display per section
- Sidebar: "Notifications" link under Tools
- Slack delivery tested on production - all 3 channels receiving

**CS intelligence (company sidebar):**
- CSInsights type + buildCSInsights() in intelligence API
- cs-insights-section.tsx sidebar component (health, sentiment, signals)
- Renders for client_meeting companies only, null for others
- E2E verified with Playwright on dev

**Pipeline triggers (CR-015):**
- detect_pipeline_triggers() SQL function on prod
- /api/notifications/triggers GET (returns triggers) + POST (real-time alert)
- Prod detects: Duetto deal_slipping, IQVIA deal_accelerating, New Reward poor_discovery

**Dev environment:**
- 31 meetings migrated from prod to dev (6 companies, diverse stages/scores)
- Dev now has 42 meetings across 14 companies

**Bug fixes:**
- Preferences API: createServerSupabase() has no session - switched to @supabase/ssr createServerClient with cookies
- CRON_SECRET whitespace in Vercel env var caused build failure - re-added clean
- Channel ID env vars had trailing newlines - re-added with printf

**Commits:** cbb07d8, 99b9f3a, 3b61a79, 4d1b859, cee29aa

**Trade-offs documented:** 10 items in memory (project_notification_tradeoffs.md) for client-readiness

### 2026-05-13 (Session 1) - Sprint 2: CS + Internal Scoring Frameworks (CR-012, CR-013)

**Dashboard components:**
- CSScores: 7 weighted gauges + strategic signal badges (expansion, risk, adoption, sponsor, timeline)
- EnhancedInternalScores: 5 weighted gauges + organizational signal badges (blockers, gaps, bottlenecks)
- Smart isCSRubricData() detection for new vs old JSONB, backward compatible fallback
- BANT/MEDDIC hidden from sidebar for non-sales meetings
- Score null safety, rep page STAGE_COLORS fixed

**n8n pipeline (MI|3 v4.4):**
- Score CS LLM chain: Stephen's 6-category rubric prompt, tested with real LLM output
- Score Internal Enhanced LLM chain: 4+2 category rubric, backward compatible
- Build Scoring Context: 6 stage classification with topic keyword fallback
- Route by Stage: 7 outputs, all connected to Process Scores
- Process Scores: CS rubric mapping (meetingScoreFull with category_scores + strategic_signals)

**End-to-end verified:**
- n8n Score CS executed (45s, real LLM output matched CSMeetingScore TypeScript interface)
- Output inserted into dev Supabase with Process Scores column mapping
- Dashboard rendered 7 gauges + 4 signal badges correctly (Playwright verified)
- Production n8n validated: all connections, Supabase URLs, stage order checked

**Commits:** `65c2b1e` (Sprint 2 main), `de69842` (rep page fix)

### 2026-05-12 - Product Meeting Analysis + Sprint 1 Deploy

**Context:** Product meeting with Matthew (CEO), Stephen (COO), Luke. Strategic pivot to focus exclusively on MI agent.

**Planning:**
- Analyzed meeting notes + Stephen's CS/Internal scoring rubrics
- Created 7 CRs (CR-010 through CR-016) in `change_requests/revision_2/`
- Validated CR-012/CR-013 against rubrics, fixed 5 gaps (call_notes, coaching signals, org signals)
- Created `teams-capture/` folder for future Teams MVP

**Sprint 1 Implementation (18 source files + 4 test files):**
- Added 2 new stage types (client_meeting, internal_client_meeting) across dashboard
- Updated all conditional rendering, API filters, charts, badges
- Fixed 4 pre-existing test failures (brand color mismatches)
- Applied Supabase RLS on scored_meetings (production)
- Created scoring_config table on dev + production (6 rows with weights)
- Set up dev Supabase with all 7 MI tables + 9 seed meetings
- Created env-reference.md with safety checklist

**Deploy:**
- Commit `30bf0f6`: 24 files, +498 -55
- Production Vercel deploy verified end-to-end (scorecard, sections, meeting detail, stage filter)

**Key files created:**
- `change_requests/revision_2/CR-010.md` through `CR-016.md`
- `teams-capture/README.md`
- `migration/env-reference.md`
- `migration/sql/2026-05-13-scored-meetings-rls.sql`
- `migration/sql/2026-05-13-scoring-config.sql`

### 2026-04-14 — Ask Blarney Chat Fix + UX Improvements

**Problem:** `/api/chat` intermittently crashing with `FUNCTION_INVOCATION_FAILED` on Vercel (1-2x/week), showing "Something went wrong" to end users.

**Root causes found (3 layered issues):**
1. Unhandled Anthropic stream errors — `messages.stream()` errors surfaced after Response was returned, bypassing try/catch
2. FF org API key was Free Tier (10K input token limit, 5 req/min) — too low for RAG prompts
3. Wrong model ID (`claude-haiku-4-5-20251001`) set via env var caused 404

**Fixes applied:**
- [x] `stream.withResponse()` catches connection-level errors (auth, rate limit, 529) inside try/catch
- [x] `safeStream` ReadableStream wrapper handles mid-stream errors gracefully (closes instead of crashing)
- [x] Token budget system (MAX_CONTEXT_TOKENS=4500): scores 45%, intelligence 35%, transcripts 20%
- [x] `CHAT_MODEL` env var for model selection (defaults to `claude-sonnet-4-20250514`)
- [x] `maxRetries: 3` on Anthropic client
- [x] Swapped Vercel API key to personal key (30K token limit, 50 req/min)
- [x] Restored progressive streaming (word-by-word response rendering)
- [x] Thin overlay scrollbar (6px, semi-transparent, works in both themes)
- [x] Removed diagnostic console.log statements

**Files modified:**
- `src/app/api/chat/route.ts` — stream error handling, token budget, retry logic
- `src/__tests__/api/chat.test.ts` — updated mock for stream pattern
- `src/app/globals.css` — thin scrollbar styles

**Commits:**
- `2dd4b96` fix: handle unhandled Anthropic stream errors in /api/chat
- `270066e` debug: add diagnostic logging (temporary)
- `cf7bf5e` fix: add token budget to prevent rate limit overflows
- `b7c9354` fix: switch to create() with SDK retries
- `faafb50` feat: make chat model configurable via CHAT_MODEL env var
- `40e1e9e` fix: restore progressive streaming + thin overlay scrollbar

### 2026-05-04 - All 9 CRs + Admin Panel + RBAC + User Profile

**Goal:** Implement all 9 change requests from Luke & Stephen, add section-based navigation, build admin panel with user management, add user profile and auth flows.

**CRs Implemented (all deployed):**
- CR-004: Remove internal meetings from analysis (Critical/Compliance)
- CR-005: Score reason summaries below gauges
- CR-009: Meeting detail page declutter
- CR-002: Top 5 strengths/improvements on rep page
- CR-003: Date range filter with calendar range picker
- CR-007: Intelligence panel expanded by default
- CR-008: BANT + MEDDIC dual framework display
- CR-006: Zoom play URL + download with passcode disclaimer
- CR-001: Section-based sidebar (All/Sales/CS/Internal)

**Additional Features Built:**
- CR-001 refinement: 12 section-awareness gaps fixed (titles, prompts, APIs, filters)
- Admin panel at /admin: create users, edit roles, toggle sections, deactivate, password reset
- User profile menu: initials dropdown, edit profile dialog, self-service password change
- Forgot password: email reset flow with recovery form on login page
- Deactivated user blocking with loading guard (no dashboard flash)
- Per-user Ask Blarney chat history (localStorage keyed by email)
- Brand color alignment: purple replaced with brand palette
- Em dashes removed from entire codebase
- Clean collapsed sidebar (sections only)
- Single-step user creation via /api/admin/users (SUPABASE_SERVICE_ROLE_KEY)

**Database Changes:**
- `user_roles` table created on dev + prod Supabase
- RLS policies: authenticated read, leadership/admin write
- Migration SQL: `migration/sql/2026-05-04-user-roles.sql`

**Tests:** 80/80 passing (3 new tests for internal exclusion + coaching API)

**Reference Docs Created:**
- `migration/product-team-feedback.md` - Slack + video feedback mapped to CRs
- `migration/architecture-vision.md` - section-based sidebar architecture
- `migration/brand-audit.md` - dashboard vs brand guidelines

**Pending:**
- n8n pipeline: add `client_meeting` + `internal_client_meeting` stage types
- Supabase RLS on scored_meetings for backend section enforcement
- Steps for both documented in `migration/session-handover.md`

### 2026-05-03 - Dev/Prod Migration + SOP + Knowledge System

**Goal:** Set up separate dev and prod environments, create operational safety net before implementing 9 change requests from Luke & Stephen.

**What was built:**

Environment Split:
- [x] Company GitHub repo (neerajkumar-builds/meeting-intelligence-agent)
- [x] Company Vercel deployment (dashboard-jet-seven-93.vercel.app) with 12 env vars
- [x] Dev Supabase (FF_Internal_Initiatives, burcfsxsxgabknmodsrd) — full schema + seeded data (305 meetings, 1851 chunks with embeddings)
- [x] Dev n8n workflows (MI-DEV|1-4, dormant, tagged "Dev")
- [x] Local .env.local switched to dev Supabase

SOP & Safety:
- [x] migration/sop.md — 9-section SOP
- [x] migration/emergency-rollback.md — 4-scenario runbook
- [x] scripts/validate-env.mjs — pre-build env validation (hooked into npm run build)
- [x] .env.example expanded from 5 to 13 vars
- [x] Centralized CHAT_MODEL env var in all 4 LLM API routes
- [x] Fixed .gitignore (tracks Vercel configs, allows .env.example)

Knowledge System:
- [x] migration/knowledge-graph.yaml — component dependency map (8 features, CR impact)
- [x] project_tracker table in dev Supabase — 9 CRs + session log + decisions
- [x] CLAUDE.md rewritten — auto-loading context with mandatory rules
- [x] 10 Claude skills (.claude/commands/mi-*.md)
- [x] migration/session-handover.md — full session record
- [x] migration/continuation-prompt.md — prompt for new sessions

**Commits (this session):**
- `6cd7e93` chore: add migration skills, CR data, and gitignore updates
- `b56a1bc` chore: organize migration files into dedicated folder structure
- `ddb7346` chore: complete dev/prod environment split
- `4dc0b1a` chore: add embedding seeder for complete dev data
- `ec35e70` chore: add comprehensive SOP, env validation, and safety fixes
- `5e385a1` chore: add knowledge system for session continuity
- `c30bef5` fix: self-review gaps — path fix, handover completeness, status accuracy

## Pending / Next Session

### Change Requests
- [x] CR-001 through CR-009: ALL COMPLETED (2026-05-04)

### Next Work
1. [x] n8n pipeline: add `client_meeting` + `internal_client_meeting` stage types (DONE Sprint 1)
2. [x] Supabase RLS on scored_meetings (DONE Sprint 1)
3. [ ] Deploy CS intelligence + pipeline triggers to production
4. [ ] CR-011 Phase 3.2+: Slack channel setup + trigger engine (needs Stephen's templates)
5. [ ] CR-014: HubSpot writeback (needs API key with write perms)
6. [ ] CR-010: Teams MVP (needs Azure AD credentials)

### Open Items
- [x] Vercel GitHub App: WORKING (auto-deploy confirmed from neerajkumar-builds org)
- [ ] Create #meeting-intel-dev Slack channel
- [ ] Migrate middleware.ts to proxy convention (Next.js 16 deprecation)
- [ ] Monitor first real client_meeting/internal_client_meeting scoring from n8n

## Environment Variables (Vercel Production)
| Variable | Purpose | Notes |
|----------|---------|-------|
| `ANTHROPIC_API_KEY` | Claude API auth | FF org Tier 3 key, set 2026-04-14 |
| `CHAT_MODEL` | Model for /api/chat | `claude-sonnet-4-20250514` |
| `GEMINI_API_KEY` | Embedding (Gemini) | For RAG vector search |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase auth | |
| `SLACK_BOT_TOKEN` | Slack integration | |
| `SLACK_WEBHOOK_URL` | Slack notifications | |
| `DAILY_QUERY_LIMIT` | Chat rate limit | Default: 50 |
| `BURST_QUERY_LIMIT` | Chat burst limit | Default: 10 |

## Architecture Notes

### /api/chat data flow (for "hello" query)
1. Frontend POSTs `{ message, history }` to `/api/chat`
2. Route embeds query via Google Gemini API (3072-dim vector)
3. Parallel: Supabase `match_meeting_chunks` RPC + `meetings_list` view
4. Fetches JSONB coaching/intelligence for matched meetings
5. Builds prompt with token budget (~5200 tokens total):
   - System prompt: ~800 tokens
   - Meeting scores: ~2000 tokens (capped at 45% of 4500)
   - Intelligence blocks: ~1500 tokens (capped at 35%)
   - Transcript chunks: ~900 tokens (capped at 20%)
6. Streams response via `messages.stream()` with `withResponse()` error check
7. Frontend parses SSE events (`content_block_delta` with `text_delta`)
