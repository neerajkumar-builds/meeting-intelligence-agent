# Meeting Intelligence Dashboard — Progress

## Current State
- **Status:** Dev/prod split complete, 9 CRs pending
- **Last session:** 2026-05-03 (migration + SOP + knowledge system)
- **Branch:** `main` (SHA: c30bef5)
- **Production URL:** https://dashboard-jet-seven-93.vercel.app (company Vercel)
- **Dev:** localhost:3003 → Supabase burcfsxsxgabknmodsrd
- **Deploy method:** `/mi-promote` skill (git push + Vercel CLI deploy)
- **Tests:** 77 passing (13 test files, Vitest)
- **Stack:** Next.js 16.2.2, React 19, Supabase, Anthropic SDK 0.82+, Tailwind v4
- **Full context:** See `migration/session-handover.md` and `migration/continuation-prompt.md`

## Session Log

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

### 2026-05-03 — Dev/Prod Migration + SOP + Knowledge System

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

### Change Requests (Priority Order)
1. [ ] CR-004: Remove internal meetings from analysis (Critical, Compliance)
2. [ ] CR-005: Score reason summaries (High)
3. [ ] CR-009: Meeting detail page refinement (High)
4. [ ] CR-006: Watch recording (Medium)
5. [ ] CR-002: Summarized strengths on rep page (High)
6. [ ] CR-003: Date range filter on rep page (Medium)
7. [ ] CR-007: Company Intel panel enhancements (Medium)
8. [ ] CR-008: MEDDIC/BANT customization (Medium)
9. [ ] CR-001: Section segmentation — Sales/CSM (Critical, needs n8n)

### Open Items
- [ ] Install Vercel GitHub App on neerajkumar-builds org (enables auto-deploy)
- [ ] Create #meeting-intel-dev Slack channel
- [ ] Create .migration/env-production file (blocks /mi-seed-dev)
- [ ] Update docs/11-replication-guide.md with correct production schema SQL
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
