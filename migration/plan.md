# Meeting Intelligence: Migration & Change Request Plan of Action

## Context

The Meeting Intelligence Dashboard is live in production with daily active users. It currently runs on Neeraj's personal GitHub and personal Vercel. The goal is to:

1. **Migrate production to company accounts** (GitHub org + Vercel team) so the company owns the stable system
2. **Repurpose personal accounts as dev environment** with full isolation (separate Supabase + dormant n8n clones)
3. **Implement 9 change requests** from Luke & Stephen, tested in dev before promoting to prod

**Why now:** Users are requesting features, but changes can't be made safely on a single production system. A dev/prod split enables safe iteration without risking the stable system.

---

## CHECKPOINT STRATEGY

### Checkpoint 0: Pre-Migration Snapshot (BEFORE ANY CHANGES)

**What we capture:**
- Git state: `git log --oneline -20`, `git status`, `git remote -v`
- Current Vercel project ID: `prj_3sbGLoNzzEAXAOGorABwnFf61Oqm`, org: `team_jQ82pAl9nP2c6UEmRlFp3LmO`
- Current Vercel URL (share with user for reference)
- Current `.env.local` contents (redacted backup)
- Supabase project ref: `cxrjlmquzhfueqrudiuy`
- n8n workflow IDs: MI|0=ENm8w8yEJGxL0yZT, MI|1=rBi3GeFd5MBkHX5W, MI|2=Eo6HPUD58cQc4miB, MI|3=AQcneXfRxHdZICeZ, MI|4=TCrG2S41dfp0kjZV
- Snapshot of `scored_meetings` count, `meeting_chunks` count, `zoom_users` list
- Export of production data (SQL dump of scored_meetings + meeting_chunks for seeding dev)

**How to rollback from here:** Not applicable — this is the baseline. If anything goes wrong in subsequent steps, we return to this state.

### Checkpoint 1: Post-GitHub Migration

**Taken after:** Company GitHub repo is created and code is pushed
**What we capture:** Company repo URL, commit SHA matches personal repo HEAD
**Rollback:** Delete company repo, no impact on anything else (personal GitHub is untouched)

### Checkpoint 2: Post-Vercel Production Setup

**Taken after:** Company Vercel is deployed and verified working
**What we capture:** Company Vercel URL, deployment ID, env var list (names only)
**Rollback:** Delete company Vercel project. Personal Vercel continues serving users (unchanged at this point). Zero user impact.

### Checkpoint 3: Post-Dev Supabase Setup

**Taken after:** Dev Supabase project created, schema applied, data seeded
**What we capture:** Dev Supabase project ref, table row counts, RPC function verified
**Rollback:** Delete dev Supabase project. Production Supabase is untouched. Zero impact.

### Checkpoint 4: Post-Dev n8n Setup

**Taken after:** Dev n8n workflows cloned and verified (then deactivated)
**What we capture:** Dev workflow IDs, credential names
**Rollback:** Delete dev n8n workflows and "Supabase Dev" credential. Production n8n untouched.

### Checkpoint 5: Post-Environment Switch

**Taken after:** Personal Vercel env vars updated to point to dev Supabase, company Vercel confirmed as production
**What we capture:** Both URLs working, data isolation confirmed
**Rollback:** Revert personal Vercel env vars to production Supabase values (restore from Checkpoint 0 `.env.local` backup)

### Per-CR Checkpoints

**Before each CR:** Git tag (e.g., `pre-CR-004`), verify `npm test` passes
**After each CR:** Git tag (e.g., `post-CR-004`), verify on dev URL, `npm test` passes
**After promotion to prod:** Verify on production URL
**Rollback:** `git revert` the CR commits, or `git reset --hard <pre-CR-XXX tag>` and force-push to dev. Production stays on last promoted version until manually pushed.

---

## FINAL VALIDATION: Cross-Reference Findings

After exhaustive scan (185 tracked files, 78 components, 11 API routes, 14 pages, 11 hooks, 15 test files), these additional items were identified:

| Finding | Impact | Action |
|---------|--------|--------|
| **Git repo = `dashboard/` only.** `knowledge_base/` and `change_requests/` are OUTSIDE the repo. Company GitHub will only contain dashboard code. | Medium | Change requests and knowledge base stay as local reference. Extract CR JSON into `dashboard/` for skills to access it. |
| **`TEST_EMAIL` and `TEST_PASSWORD` env vars** used in E2E tests (not listed in `.env.example`). | Low | Add to both Vercel environments if E2E tests are run in CI. |
| **`docs/progress.md` is untracked** | Low | Commit or add to .gitignore |
| **No `.prettierrc` configured** | Low | Optional — add if code formatting consistency is needed |
| **`.npmrc` has `legacy-peer-deps=true`** | Low | Already in repo. Must be present for `npm install` to work (React 19 peer dep issues) |
| **Vercel Analytics** (`@vercel/analytics`) starts fresh on company project | Low | No code change needed. Analytics data on personal Vercel stays (dev usage tracking). |
| **No SQL migration files** — all schema managed via Supabase dashboard | Medium | Must extract production schema manually for dev setup. No migration script to replay. |
| **JSONB score fields typed as `unknown`** — safe parsing via `safeParseJson()` in `utils/scores.ts` | Low | No issue for migration. Good defensive pattern already in place. |

---

## SELF-REVIEW: GAPS IDENTIFIED & MITIGATIONS

| # | Gap | Severity | Mitigation |
|---|-----|----------|------------|
| 1 | **Zoom API duplication** — both dev and prod n8n would capture same meetings, doubling LLM costs | High | RESOLVED: Dev n8n stays dormant. Activated only when testing pipeline changes (CR-001). Dev Supabase seeded with production data export. |
| 2 | **URL transition** — users currently access personal Vercel URL; company Vercel is a different URL | Medium | RESOLVED: Share new company Vercel URL with users. Old personal Vercel URL stays alive (now pointing to dev data, not production). Communicate the switch to the team. |
| 3 | **Replication guide SQL is outdated** — `docs/11-replication-guide.md` uses `vector(768)` but production uses `halfvec(3072)` | High | RESOLVED: Extract SQL directly from production Supabase (via SQL editor or schema dump), NOT from the replication guide. We'll also update the replication guide as a deliverable. |
| 4 | **No data seeding** — empty dev Supabase with dormant n8n means no data to test with | High | RESOLVED: Export production data (scored_meetings + meeting_chunks + zoom_users) and import into dev Supabase as initial seed. |
| 5 | **Slack dev/prod isolation** — same bot token could post to wrong channels if env var misconfigured | Medium | Mitigation: Dev env uses `SLACK_ALLOWED_CHANNELS=meeting-intel-dev` (a dedicated dev channel). Create this channel in Slack before setup. Even if misconfigured, the allowlist prevents posting to production channels. |
| 6 | **CR-001 naming convention ambiguity** — "Check-In" exists in naming doc but may map to existing stage type | Medium | Mitigation: Before CR-001 implementation, audit n8n MI|1 workflow to see how "Check-In" meetings are currently classified. May already map to `follow_up` or a different stage. |
| 7 | **Git branch strategy not defined** — plan says work on `main` but doesn't specify feature branching | Low | Mitigation: For each CR, create a feature branch (e.g., `cr-004-remove-internal`), test on dev, merge to `main`, then `git push production main`. This keeps main stable. |
| 8 | **No automated CI on company repo** — company Vercel auto-deploys without test gate | Medium | Mitigation: Add a simple GitHub Action on company repo that runs `npm test && npm run build` on push to main. This prevents broken deployments. (Optional, can be added later.) |
| 9 | **`recording_url` format unknown for CR-006** — might be download URL not playable URL | Low | Mitigation: Inspect actual `recording_url` values in production data before implementing CR-006. If download-only, keep current behavior (opens Zoom in new tab). |
| 10 | **Supabase dev project cost** — additional Supabase project adds to monthly cost | Low | Note: Supabase Free tier supports 2 projects. If already on a paid plan, additional project is included or has minimal cost. Verify before creating. |

---

## DOCUMENTATION DELIVERABLES

We'll produce these documents during/after the migration:

| Document | Purpose | Location |
|----------|---------|----------|
| **Environment Registry** | URLs, project IDs, env vars (names, not values) for both dev and prod | `docs/13-environment-registry.md` |
| **Promotion Runbook** | Step-by-step: how to promote dev code to production | `docs/14-promotion-runbook.md` |
| **Updated Replication Guide** | Fix the outdated SQL in `docs/11-replication-guide.md` to match actual production schema | Update existing file |
| **CR Implementation Log** | Per-CR: what changed, which files, how to test, rollback steps | `docs/15-change-log-revision-1.md` |

---

## WORKSTREAM 1: Environment Setup

### Architecture: Target State

```
PRODUCTION (Company Accounts)           DEVELOPMENT (Personal Accounts)
──────────────────────────────          ────────────────────────────────
GitHub: <company-org>/meeting-intel     GitHub: say2neeraj/fullfunnel-meeting-intel
Vercel: Company team (auto-deploy)      Vercel: Personal account
Supabase: cxrjlmquzhfueqrudiuy         Supabase: NEW dev project (same org)
n8n: MI|0 through MI|4 (active)        n8n: MI|0-DEV through MI|4-DEV (DORMANT)
Slack: Production channels              Slack: #meeting-intel-dev only
```

**Data isolation:** Dev and prod databases are completely separate. Dev n8n is dormant. Dev Supabase is seeded with a one-time production export.

### Step 0: Pre-Migration Snapshot (Checkpoint 0)

1. Record current git state, Vercel URL, Supabase stats
2. Backup `.env.local` (copy to `.env.local.backup-pre-migration`)
3. Export production data for dev seeding:
   - `scored_meetings`: full table export (SQL INSERT statements)
   - `meeting_chunks`: full table export
   - `zoom_users`: full table export
   - `scoring_run_log`: last 10 runs
4. Record n8n workflow IDs and their current active/inactive status
5. Save all of the above as the pre-migration baseline

### Step 1: Company GitHub Repo

1. Create repo in company GitHub org
2. Add as remote: `git remote add production https://github.com/<company-org>/<repo-name>.git`
3. Push: `git push production main`
4. **Verify:** Repo appears with full code and commit history
5. **CHECKPOINT 1**

### Step 2: Company Vercel Production Deployment

1. In company Vercel: "New Project" -> Import from company GitHub repo
2. Add all 12 environment variables (pointing to EXISTING production Supabase):

| Variable | Environment | Value |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production | `https://cxrjlmquzhfueqrudiuy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | (existing anon key) |
| `ANTHROPIC_API_KEY` | Production | (existing key) |
| `GEMINI_API_KEY` | Production | (existing key) |
| `CHAT_MODEL` | Production | `claude-sonnet-4-20250514` |
| `SLACK_WEBHOOK_URL` | Production | (production webhook) |
| `SLACK_BOT_TOKEN` | Production | (existing bot token) |
| `SLACK_ALLOWED_CHANNELS` | Production | (production channel list) |
| `NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS` | Production | `8` |
| `DAILY_QUERY_LIMIT` | Production | `50` |
| `BURST_QUERY_LIMIT` | Production | `10` |
| `BLOB_READ_WRITE_TOKEN` | Production | (auto-generated by Vercel) |

3. Enable auto-deploy from `main` branch
4. Deploy
5. **Verify:** Login works, scorecard shows real data, Ask Blarney returns answers, Slack sends correctly
6. **CHECKPOINT 2**
7. **Share new company Vercel URL with team as the new production URL**

### Step 3: Dev Supabase Project

1. Check Supabase plan limits (Free tier allows 2 projects; paid plan may allow more)
2. Create project `meeting-intel-dev` in same Supabase org
3. Enable pgvector: `CREATE EXTENSION IF NOT EXISTS vector;`
4. **Extract production schema SQL** from Supabase SQL Editor (not from replication guide):
   - Use `pg_dump` or manual extraction for: `scored_meetings`, `meeting_chunks`, `scoring_run_log`, `zoom_users`
   - Create `meetings_list` VIEW matching production (12 columns)
   - Create `chat_analytics` and `meeting_notes` tables with all indexes
   - Create `match_meeting_chunks` RPC function (using `halfvec(3072)`, `chunk_text` column names)
   - Set up RLS policies (same as production)
5. **Import seed data** from Checkpoint 0 exports:
   - `scored_meetings`: all rows
   - `meeting_chunks`: all rows
   - `zoom_users`: all rows
   - `scoring_run_log`: last 10 runs
6. Create test auth users (same emails as production, or separate test accounts)
7. Note project URL + anon key + service_role key
8. **Verify:** `SELECT COUNT(*) FROM scored_meetings` matches production count, `match_meeting_chunks` RPC returns results
9. **CHECKPOINT 3**

### Step 4: Dev n8n Workflows (Dormant)

1. Duplicate each workflow in n8n:
   - `MI|0-DEV: Token Service`
   - `MI|1-DEV: Capture + Sync`
   - `MI|2-DEV: Transcript + Enrich`
   - `MI|3-DEV: Score Meetings`
   - `MI|4-DEV: Chunk + Embed`
2. Create n8n credential "Supabase Dev" with dev project URL + service_role key
3. Swap Supabase credentials in all dev workflows to "Supabase Dev"
4. **Keep all dev workflows INACTIVE** (do NOT activate)
5. Record dev workflow IDs
6. **Verify:** Each workflow opens without errors, correct Supabase credential shown
7. **CHECKPOINT 4**

### Step 5: Switch Dev Environment

1. Create Slack channel `#meeting-intel-dev`
2. Update local `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://<dev-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev-anon-key>
SLACK_ALLOWED_CHANNELS=meeting-intel-dev
NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS=24
DAILY_QUERY_LIMIT=200
BURST_QUERY_LIMIT=50
```
(Anthropic, Gemini, CHAT_MODEL, SLACK_BOT_TOKEN, SLACK_WEBHOOK_URL stay same)

3. Update personal Vercel env vars: `npx vercel env rm <var> && npx vercel env add <var>` for each changed variable
4. Deploy personal Vercel: `npx vercel --prod`
5. **Verify:**
   - Local `npm run dev` shows dev data (seeded from production)
   - Personal Vercel URL shows dev data
   - Company Vercel URL still shows production data (unchanged)
   - Slack send from dev goes to `#meeting-intel-dev` only
6. **CHECKPOINT 5 — Migration complete**

### Step 6: Establish Promotion Workflow

```
Feature branch (personal GitHub)
  |
  | PR or local merge to main
  v
main (personal GitHub) -----> Personal Vercel auto-deploys (DEV)
  |
  | git push production main (MANUAL, after dev verification)
  v
main (company GitHub) -------> Company Vercel auto-deploys (PROD)
```

**Promotion checklist (for each deployment to production):**
1. `npm test` passes locally
2. `npm run build` succeeds
3. Feature verified on dev URL
4. `git push production main`
5. Verify on production URL after deploy completes

### Step 7: Documentation

Produce the 4 documentation deliverables:
- `docs/13-environment-registry.md` — both environment details
- `docs/14-promotion-runbook.md` — step-by-step promotion process
- Update `docs/11-replication-guide.md` — fix outdated SQL
- Prepare `docs/15-change-log-revision-1.md` — template for CR tracking

---

## WORKSTREAM 2: Change Request Implementation

### CR Summary & Priority Order

| Order | CR | Title | Priority | Type | Dashboard-Only? |
|-------|-----|-------|----------|------|----------------|
| 1 | CR-004 | Remove internal meetings from analysis | Critical | Compliance | YES |
| 2 | CR-005 | Score reason summaries | High | UI Enhancement | YES |
| 3 | CR-009 | Meeting detail page refinement | High | UI Enhancement | YES |
| 4 | CR-006 | Watch recording (not download) | Medium | UI Enhancement | YES (verify URL format first) |
| 5 | CR-002 | Summarized strengths on rep page | High | New Feature + API | YES (new Claude API call) |
| 6 | CR-003 | Date range filter on rep dashboard | Medium | UI Enhancement | YES |
| 7 | CR-007 | Company Intel panel enhancements | Medium | UI Enhancement | YES |
| 8 | CR-008 | MEDDIC/BANT customization | Medium | Refactor | YES |
| 9 | CR-001 | Section segmentation (Sales/CSM) | Critical | Architecture | NO — needs n8n changes |

### Phase 1: Dashboard-Only, Data Exists (Weeks 2-3)

#### CR-004 — Remove Internal Meetings (Critical, Compliance)

**What:** Filter `scoring_stage_type = 'internal'` out of all external-facing analytics. Keep internal data in DB (valuable for action items/decisions). Keep accessible via explicit "Internal" filter.

**Approach:** n8n continues scoring internal meetings. Dashboard filters them out by default.

**Files to modify:**
- `src/lib/hooks/use-meetings-list.ts` — add default `.neq('scoring_stage_type', 'internal')` filter, with opt-in `includeInternal` parameter
- `src/app/api/companies/[name]/intelligence/route.ts` — add `.neq('scoring_stage_type', 'internal')` to query
- `src/app/api/reps/[name]/coaching/route.ts` — add same filter
- `src/app/meetings/page.tsx` — verify stage filter dropdown behavior (exclude internal from default "all", keep as opt-in filter option)

**Decision to make:** Should internal meetings still appear when user explicitly selects "Internal" in the filter dropdown? (Recommendation: Yes, for visibility without impacting KPIs)

**Verify:** Scorecard KPIs exclude internal meetings. Meeting feed hides internal by default. Company and rep pages exclude internal from aggregations. Internal filter still works when explicitly selected.

---

#### CR-005 — Score Reason Summaries (High)

**What:** Show a brief text reason alongside each score gauge on meeting detail.

**Data already exists:**
- Discovery: `meeting_score.reasoning_summary`, `icp_score.reason_for_score`
- Follow-up: `meeting_score.relationship_health`
- Onboarding: `meeting_score.delivery_status`, `meeting_score.current_phase`
- Internal: `internal_summary.quality.key_insight`

**Files to modify:**
- `src/components/meetings/score-section.tsx` — add reason text below each `CircularGauge`. Use 2-sentence truncation for long paragraphs.

**Verify:** Each stage type shows relevant reason text below its score gauges.

---

#### CR-009 — Meeting Detail Refinement (High)

**What:** Remove noise, focus on scores + score reasons + company intelligence + scoring framework + video.

**Files to modify:**
- `src/app/meetings/[id]/page.tsx` — restructure layout priorities:
  1. Scores + reasons (prominent, top area)
  2. Recording banner (more prominent)
  3. Company Intelligence (visible, not hidden sidebar)
  4. Collapse or simplify verbose "Next Steps" and "Analysis" sections
- `src/components/meetings/intelligence-tabs.tsx` — simplify tab content, make reasoning collapsible

**Decision to make:** What specific sections to remove vs. collapse? Need user input on what "noise" means to Luke/Stephen.

**Verify:** Meeting detail page is cleaner, key info is immediately visible.

---

#### CR-006 — Watch Recording (Medium)

**Pre-check:** Inspect `recording_url` values in production data to determine if they're playable or download-only.

```sql
SELECT recording_url FROM scored_meetings WHERE recording_url IS NOT NULL LIMIT 5;
```

**If playable URL:** Current implementation (Zoom link opens in new tab) already works. Verify and document.
**If download URL:** Investigate Zoom shareable link format. May need n8n MI|1 to capture the share/play URL instead.

**Files to modify (if iframe approach):**
- New: `src/components/meetings/recording-player.tsx` — modal iframe player
- `src/app/meetings/[id]/page.tsx` — replace banner with expandable player

**Verify:** User can watch recording without downloading.

---

### Phase 2: Rep & Company Enhancements (Weeks 3-4)

#### CR-002 — Summarized Strengths on Rep Page (High)

**What:** Top 5 strengths + top 5 areas for improvement, AI-summarized from all meetings.

**Files to create:**
- `src/app/api/reps/[name]/summary/route.ts` — Claude summarization of all `rep_score` data for the rep. Cache result in Supabase or in-memory with 24h TTL.
- `src/components/reps/rep-strength-summary.tsx` — UI showing top 5 + top 5 with drill-down option
- `src/lib/hooks/use-rep-summary.ts` — client hook

**Files to modify:**
- `src/app/reps/[name]/page.tsx` — add summary component above coaching detail

**Verify:** Rep page shows concise top 5/5 summary. Drill-down shows full coaching insights.

---

#### CR-003 — Date Range Filter on Rep Dashboard (Medium)

**What:** Date range selector on rep profile page.

**Files to modify:**
- `src/app/reps/[name]/page.tsx` — add `dateRange`/`dateFrom`/`dateTo` state (same pattern as meetings page), apply to meetings useMemo and KPI calculations

**Verify:** Rep KPIs and meeting list filter by selected date range.

---

#### CR-007 — Company Intelligence Panel Enhancements (Medium)

**What:** Make Intelligence more visible and discoverable.

**Files to modify:**
- Intelligence sidebar components — default to expanded on desktop
- Add "Quick Summary" header section with most critical signal
- Potentially move from sidebar to main content area

**Decision to make:** What "more discoverable" means specifically. Tab in main content area? Always-visible panel? Need stakeholder input.

**Verify:** Intelligence is visible without user action. Summary provides quick read.

---

#### CR-008 — MEDDIC/BANT Customization (Medium)

**What:** Support multiple sales qualification frameworks, not just MEDDIC.

**Files to modify:**
- `src/lib/constants.ts` — add `AnalysisFramework` type, framework dimension definitions
- `src/app/api/companies/[name]/intelligence/route.ts` — refactor `buildMeddicAnalysis` into generic `buildFrameworkAnalysis`
- `src/types/intelligence.ts` — rename types to framework-generic
- Sidebar components — render any framework's dimensions

**Verify:** Switching framework constant changes the analysis dimensions displayed.

---

### Phase 3: Section Segmentation — CR-001 (Weeks 4-6)

This is the largest CR. Requires n8n changes first.

#### 3A: n8n Changes (activate dev n8n for testing)

1. Activate dev n8n workflows temporarily
2. Update MI|1-DEV: add `check_in` stage classification for "Check-In" keyword meetings
3. Update MI|3-DEV: add CSM-specific scoring prompts for `check_in` stage
4. Define `check_in` JSONB score structure (adoption, health, renewal risk)
5. Run dev n8n pipeline, verify `check_in` meetings score correctly in dev Supabase
6. Deactivate dev n8n workflows
7. After dashboard changes verified, apply same n8n changes to production workflows

#### 3B: Dashboard Schema Updates

- `src/lib/constants.ts` — add `check_in` to `ScoringStageType`, add `AnalysisSection` type (`'sales' | 'csm'`), stage-to-section mapping
- `src/types/scores.ts` — add `CheckInMeetingScore` interface
- Score extraction functions — handle `check_in` stage

#### 3C: Navigation Overhaul

**Approach:** URL query parameter (`?section=sales`, `?section=csm`) — avoids duplicating page files.

```
Sales Call Analysis
  ├── Scorecard    (?section=sales)
  ├── Meetings     (?section=sales)
  ├── Companies    (?section=sales)
  └── Reps         (?section=sales)
Customer Success
  ├── Scorecard    (?section=csm)
  ├── Meetings     (?section=csm)
  ├── Companies    (?section=csm)
  └── Reps         (?section=csm)
Ask Blarney
System Health
```

- `sidebar-nav.tsx` — section-based grouping
- All page.tsx files — read section parameter, filter by relevant stage types
- Same components, filtered data upstream

**Verify:** Sales section shows only discovery + follow_up. CSM shows onboarding + check_in. Internal excluded from both (per CR-004).

---

## KEY FILES ACROSS ALL CRs

| File | CRs |
|------|-----|
| `src/lib/constants.ts` | CR-001, CR-004, CR-008 |
| `src/lib/hooks/use-meetings-list.ts` | CR-001, CR-004 |
| `src/components/meetings/score-section.tsx` | CR-005, CR-009 |
| `src/app/meetings/[id]/page.tsx` | CR-005, CR-006, CR-009 |
| `src/app/api/companies/[name]/intelligence/route.ts` | CR-004, CR-007, CR-008 |
| `src/app/reps/[name]/page.tsx` | CR-002, CR-003 |
| `src/components/layout/sidebar-nav.tsx` | CR-001 |

---

## RISK REGISTER

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| Dev/prod Supabase schema drift | High | Extract SQL from production, not from outdated replication guide | Planned |
| CR-001 n8n changes break scoring | High | Test on dev n8n first, never modify prod directly | Planned |
| Same Slack bot posts to wrong channels | Medium | `SLACK_ALLOWED_CHANNELS` enforces channel isolation | Planned |
| `recording_url` is download-only | Medium | Inspect values before CR-006 implementation | Pre-check required |
| Company Vercel deploys untested code | Medium | Promotion is manual (`git push production main`) after dev verification | Planned |
| Dev Supabase has stale data over time | Low | Re-seed periodically from production if needed, or activate dev n8n temporarily | Acceptable |
| Supabase plan limits (2 projects on Free) | Low | Verify before creating dev project | Pre-check required |
| Users bookmark old personal Vercel URL | Medium | Communicate new URL to team. Personal Vercel stays alive (serves dev, not prod) | Communication needed |

---

## PRE-IMPLEMENTATION: SKILLS TO CREATE (Step 0)

These skills formalize the dev/prod workflow so every session follows the same process. **Created before any other implementation work.**

### Pre-requisite: Extract CR data to parseable format

The change log is in XLSX format (outside the git repo), which Claude cannot parse directly. Extract all 9 CRs into a JSON file INSIDE the dashboard directory so it's version-controlled and accessible to skills:

**File:** `dashboard/src/data/change-requests.json`

```json
{
  "CR-001": { "title": "...", "priority": "...", "submitter": "...", "description": "...", "justification": "...", "loe": "...", "status": "...", "files": [...], "dependencies": [...] },
  ...
}
```

This file is the single source of truth for CR details in code. The original XLSX stays as the canonical external document.

### Pre-requisite: Add `.checkpoints.log` to `.gitignore`

Prevent checkpoint logs from being committed.

---

### Skill 1: `/mi-promote` — Dev to Production Promotion

**Trigger:** When code is ready to go from dev to production
**Behavior:**
1. **Pre-flight git checks:**
   - Verify current branch is `main` — abort if on a feature branch
   - Verify no uncommitted changes — abort if dirty working tree
   - Verify `production` remote exists — abort with setup instructions if missing
2. Run `npm test` in dashboard directory — abort if any fail
3. Run `npm run build` — abort if build fails
4. **Show promotion diff:** `git log production/main..main --oneline` — shows exactly what commits will be promoted
5. Ask user to confirm: "These N commits will be deployed to production. Proceed?"
6. Run `git push production main`
7. Wait for user to confirm company Vercel deployment completed
8. Remind user to verify on production URL: login, scorecard, Ask Blarney, Slack
9. Log promotion to `dashboard/.promotions.log`: timestamp, commit SHA, commit count

---

### Skill 2: `/mi-checkpoint <label>` — Pre-Change Checkpoint

**Trigger:** Before any risky change (CR start, migration step, config change)
**Arguments:** `<label>` — descriptive name (e.g., `pre-cr-004`, `pre-migration`)
**Behavior:**
1. Verify no uncommitted changes — warn if dirty (checkpoint captures committed state only)
2. Create git tag: `checkpoint/<label>-<date>` (e.g., `checkpoint/pre-cr-004-2026-05-05`)
3. Record to `dashboard/.checkpoints.log` (append-only, in .gitignore):
   - Label, date, branch, commit SHA
   - `npm test` result (pass count / fail count)
   - Dev Supabase row counts: `scored_meetings`, `meeting_chunks`, `zoom_users`
4. Print: "Checkpoint `<label>` created at `<SHA>`"
5. Print: "To rollback: `/mi-rollback <label>`"
6. Print: "To list all checkpoints: `git tag -l 'checkpoint/*'`"

---

### Skill 3: `/mi-rollback <checkpoint-label>` — Guided Rollback

**Trigger:** When something went wrong and you need to revert to a checkpoint
**Arguments:** `<checkpoint-label>` — the label from `/mi-checkpoint`
**Behavior:**
1. Find the git tag `checkpoint/<label>-*` — abort if not found, list available checkpoints
2. Show what will be lost: `git log checkpoint/<tag>..HEAD --oneline`
3. Ask user to confirm: "This will discard N commits. Are you sure?"
4. Stash any uncommitted changes (safety net)
5. `git reset --hard <tag>`
6. Print: "Rolled back to checkpoint `<label>`. Stashed changes available via `git stash list`"
7. If the rollback affects env vars or Supabase, remind user to verify manually

---

### Skill 4: `/mi-cr-start <CR-ID>` — Start CR Implementation

**Trigger:** When beginning work on a change request
**Arguments:** `<CR-ID>` — e.g., `CR-004`
**Behavior:**
1. Read CR details from `src/data/change-requests.json` — display title, priority, description, business justification, LOE, submitter
2. **Dependency check:** Cross-reference with the plan's dependency graph. Warn if this CR depends on another unfinished CR
3. **Branch check:** Verify no existing branch `cr-<id>-*` exists — warn if found (resume or create new)
4. Create feature branch: `git checkout -b cr-<id>-<slug>` (e.g., `cr-004-remove-internal`)
5. Run `/mi-checkpoint pre-<CR-ID>`
6. Load implementation guidance from the plan:
   - Files to modify
   - Approach description
   - Decisions to make
   - Verification criteria
7. Print: "Ready to implement. When done, run `/mi-cr-complete <CR-ID>`"

---

### Skill 5: `/mi-cr-complete <CR-ID>` — Complete CR Implementation

**Trigger:** When a CR is implemented and ready for review
**Arguments:** `<CR-ID>` — e.g., `CR-004`
**Behavior:**
1. **Verify on correct branch:** Must be on `cr-<id>-*` branch — abort if on main
2. Run `npm test` — abort if failures
3. Run `npm run build` — abort if build fails
4. Optionally run `npm run test:e2e` (ask user — E2E tests are slower)
5. Ask user: "Have you verified this feature on the dev URL? (y/n)"
6. Run `/mi-checkpoint post-<CR-ID>`
7. **Rebase check:** `git log main..HEAD` to verify branch is up to date with main
8. **Show diff summary:** Files changed, lines added/removed
9. Ask: "Merge strategy? (1) Squash merge — cleaner history (2) Regular merge — preserves commits"
10. Merge to main per selected strategy
11. Append to `docs/15-change-log-revision-1.md`:
    ```
    ## CR-<ID>: <Title>
    - **Date completed:** <date>
    - **Implemented by:** Neeraj
    - **Files modified:** <list from git diff>
    - **How to verify:** <from plan's verification criteria>
    - **Rollback:** git revert <merge-commit-SHA>
    ```
12. Ask: "Ready to promote to production? Run `/mi-promote`"

---

### Skill 6: `/mi-env-check` — Environment Health Check

**Trigger:** Start of any session, or when verifying environments
**Behavior:**
1. **Git state:**
   - Check remotes: `origin` (personal) and `production` (company) exist and are reachable (`git ls-remote --exit-code`)
   - Current branch + uncommitted changes
   - Commits ahead of `production/main` (unpromoted changes)
2. **Dev environment:**
   - Read `NEXT_PUBLIC_SUPABASE_URL` from `.env.local` — verify it points to dev (NOT `cxrjlmquzhfueqrudiuy`)
   - Query dev Supabase: `SELECT COUNT(*) FROM scored_meetings, meeting_chunks, zoom_users`
   - Check data freshness: `SELECT MAX(scored_at) FROM scored_meetings`
   - Check `scoring_run_log` last entry (dev n8n status)
3. **Production environment (read-only):**
   - Check `scoring_run_log` via production Supabase (if credentials available)
   - Or: report last promotion timestamp from `.promotions.log`
4. **Report:**
   ```
   DEV:  Connected to <dev-project>. Meetings: X. Last scored: <date>. Data age: Y days.
   PROD: Last promoted: <date>. Commits behind dev: Z.
   GIT:  Branch: main. Clean: yes/no. Remotes: origin ✓, production ✓
   ```
5. **Warnings:** Connected to production locally, stale data (>7 days), unpromoted commits, uncommitted changes

---

### Skill 7: `/mi-seed-dev` — Re-seed Dev from Production

**Trigger:** When dev data is stale or needs refresh
**Behavior:**
1. **Safety checks:**
   - Read `NEXT_PUBLIC_SUPABASE_URL` from `.env.local` — ABORT if it points to production
   - Ask: "This will REPLACE all data in dev Supabase. Dev `meeting_notes` and `chat_analytics` will be preserved (not truncated). Continue?"
2. **Read production Supabase credentials** from `.env.production` file (separate from `.env.local`, in .gitignore):
   ```
   PROD_SUPABASE_URL=https://cxrjlmquzhfueqrudiuy.supabase.co
   PROD_SUPABASE_SERVICE_KEY=<service_role_key>
   ```
   If file doesn't exist, prompt user to create it.
3. **Export from production** (read-only via Supabase MCP or SQL):
   - `scored_meetings`: all rows
   - `meeting_chunks`: all rows
   - `zoom_users`: all rows
   - `scoring_run_log`: last 20 runs
4. **Import to dev** (via dev Supabase MCP):
   - Truncate n8n-owned tables only (NOT `chat_analytics`, `meeting_notes`)
   - Insert exported data
5. **Verify:**
   - Row counts match source
   - `match_meeting_chunks` RPC returns results for a test query
6. **Log:** Seed timestamp, row counts, production snapshot date

---

### Skill 8: `/mi-session-init` — Session Initialization

**Trigger:** Start of every working session on this project
**Behavior:**
1. Run `/mi-env-check` (abbreviated — no remote checks unless issues detected)
2. Check for in-progress work:
   - Any feature branches (`cr-*`)? Report which CR is in progress
   - Uncommitted changes? Report files
3. Read `docs/15-change-log-revision-1.md` — report which CRs are complete
4. Read the plan — report next CR in implementation order
5. Print session context:
   ```
   SESSION: Meeting Intelligence
   IN PROGRESS: CR-004 (branch: cr-004-remove-internal, 3 commits ahead of main)
   COMPLETED: none yet
   NEXT UP: CR-004 — Remove internal meetings (Critical)
   DEV DATA: 76 meetings, last scored 2 days ago
   ```

---

### Implementation Notes for All Skills

1. **Credential storage:** Production Supabase credentials stored in `.env.production` (in .gitignore), separate from `.env.local` (dev). This prevents accidentally connecting to production.
2. **Log files:** `.checkpoints.log` and `.promotions.log` added to `.gitignore`. These are local-only operational logs.
3. **Supabase access:** Skills use Supabase MCP tools when available, fall back to `psql` or API calls via `curl`.
4. **Error handling:** All skills abort on failure with clear error messages and suggested fixes. No silent failures.
5. **CR data source:** All CR details read from `change_requests/revision_1/change-log.json` (pre-extracted from XLSX). Skills should NOT attempt to parse XLSX directly.

---

## TIMELINE

| Phase | Effort | Timeframe | Prerequisite |
|-------|--------|-----------|--------------|
| **Step 0: Create 8 skills + extract CR data** | 0.5 day | Day 1 | None — first thing |
| Checkpoint 0 + Environment Setup | 2-3 days | Week 1 | Skills created |
| Documentation deliverables | 1 day | End of Week 1 | Setup complete |
| Phase 1: CR-004, 005, 009, 006 | 5-7 days | Weeks 2-3 | Setup complete, use `/mi-cr-start` |
| Phase 2: CR-002, 003, 007, 008 | 5-7 days | Weeks 3-4 | Independent of Phase 1 |
| Phase 3: CR-001 | 8-12 days | Weeks 4-6 | n8n dev testing first |
| **Total** | **~6 weeks** | | |

---

## VERIFICATION CHECKLIST

### Post-Migration
- [ ] Company Vercel URL: login, scorecard, Ask Blarney, Slack all work
- [ ] Dev Supabase: schema matches production, seed data present, RPC works
- [ ] Dev n8n: workflows exist and open without errors (stay inactive)
- [ ] Local dev: `npm run dev` connects to dev Supabase, shows seeded data
- [ ] Isolation confirmed: dev changes don't appear on production URL
- [ ] `git push production main` triggers company Vercel deploy
- [ ] Documentation produced: environment registry, promotion runbook

### Post-CR (for each)
- [ ] Feature works on dev URL
- [ ] `npm test` passes (77+ tests)
- [ ] `npm run build` succeeds
- [ ] No regressions on other features
- [ ] Promoted to production, verified on production URL
- [ ] CR implementation logged in `docs/15-change-log-revision-1.md`
