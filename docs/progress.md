# Meeting Intelligence Dashboard — Progress

## Current State
- **Status:** Sprint 1 + Sprint 2 deployed. CR-012 + CR-013 implemented.
- **Last session:** 2026-05-13 (~8 hours, Sprint 1 + 2 + production deploy + n8n v4.4)
- **Branch:** `main` at `de69842`, production remote in sync
- **Production URL:** https://dashboard-jet-seven-93.vercel.app (company Vercel)
- **Dev:** localhost:3003 - Supabase burcfsxsxgabknmodsrd (MI tables + 11 meetings including CS rubric test data)
- **Deploy method:** `git push production main && npx vercel --prod`
- **Tests:** 80 passing (14 test files, Vitest)
- **Stack:** Next.js 16.2.2, React 19, Supabase, Anthropic SDK 0.82+, Tailwind v4
- **Stage types:** 6 (discovery_scoping, follow_up, onboarding, client_meeting, internal_client_meeting, internal)
- **Supabase:** RLS active, scoring_config v2, dev has full MI schema
- **n8n prod:** MI|3 v4.4 with 6 LLM chains (Score CS + Score Internal Enhanced added)
- **Full context:** See `migration/session-handover.md`

## Backlog
- [x] Sprint 1: Add 2 new stage types + RLS + scoring_config (DONE 2026-05-13)
- [x] Sprint 2: CR-012 CS Scoring Framework (DONE 2026-05-13)
- [x] Sprint 2: CR-013 Internal Scoring Enhancement (DONE 2026-05-13)
- [ ] Sprint 3: CR-011 Notification + Digest System (Slack channels + email)
- [ ] Sprint 3: CR-014 HubSpot Score Writeback
- [ ] Sprint 3: CR-015 Pipeline Trigger Alerts
- [ ] Sprint 4: CR-010 Teams Recording Capture MVP
- [ ] Deferred: CR-016 Modular Pricing
- [ ] Dev GitHub remote (say2neeraj) repo not found - needs fix or removal
- [ ] Monitor first real client_meeting scoring in next n8n cycle

## Session Log

### 2026-05-13 - Sprint 2: CS + Internal Scoring Frameworks (CR-012, CR-013)

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
1. [ ] n8n pipeline: add `client_meeting` + `internal_client_meeting` stage types (see session-handover.md)
2. [ ] Supabase RLS on scored_meetings for backend section enforcement (see session-handover.md)

### Open Items
- [ ] Install Vercel GitHub App on neerajkumar-builds org (enables auto-deploy)
- [ ] Create #meeting-intel-dev Slack channel
- [ ] Create .migration/env-production file (blocks /mi-seed-dev)
- [ ] Migrate middleware.ts to proxy convention (Next.js 16 deprecation)

### Unstaged Changes (from prior session, not committed)
- `src/components/companies/intelligence-sidebar/meddic-section.tsx` — radar chart for MEDDIC
- `src/components/scorecard/competitor-mentions.tsx` — bar chart for vendor mentions

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
