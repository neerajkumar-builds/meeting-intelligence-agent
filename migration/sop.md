# Meeting Intelligence: Standard Operating Procedure

**Last Updated:** 2026-05-03
**Owner:** Neeraj Kumar

---

## Architecture Quick Reference

```
Zoom Meetings → n8n (5 workflows, 8h cycle) → Supabase → Next.js Dashboard → Users
```

| Component | Production | Development |
|-----------|-----------|-------------|
| GitHub | `neerajkumar-builds/meeting-intelligence-agent` | `say2neeraj/fullfunnel-meeting-intel` |
| Vercel | `dashboard-jet-seven-93.vercel.app` | localhost / personal Vercel |
| Supabase | `cxrjlmquzhfueqrudiuy` (project_n8n) | `burcfsxsxgabknmodsrd` (FF_Internal_Initiatives) |
| n8n | MI\|0-4 (active, 8h) | MI-DEV\|1-4 (dormant) |

**Env vars that DIFFER between environments:**
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SLACK_ALLOWED_CHANNELS`, `NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS`, `DAILY_QUERY_LIMIT`, `BURST_QUERY_LIMIT`

**Env vars that are SHARED:**
`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `CHAT_MODEL`, `SLACK_WEBHOOK_URL`, `SLACK_BOT_TOKEN`

**Claude Skills:** `/mi-session-init`, `/mi-env-check`, `/mi-promote`, `/mi-checkpoint`, `/mi-rollback`, `/mi-cr-start`, `/mi-cr-complete`, `/mi-seed-dev`, `/mi-sop`

---

## A. Daily Development Workflow

### A.1 Session Start

Run `/mi-session-init` or manually:
- [ ] Verify `.env.local` points to dev Supabase (NOT `cxrjlmquzhfueqrudiuy`)
- [ ] Check git branch and uncommitted changes
- [ ] Check for in-progress CR branches (`git branch --list "cr-*"`)

### A.2 Making Code Changes

**Branch strategy:**
- CR work: `cr-<id>-<slug>` (e.g., `cr-004-remove-internal`)
- Features: `feat/<description>`
- Bugs: `fix/<description>`

**Per-commit checklist:**
- [ ] `npm test` passes
- [ ] `npm run build` succeeds (includes env validation)
- [ ] Commit message describes the why, not just the what

### A.3 Testing on Dev

1. **Unit tests:** `npm test`
2. **Visual check:** `npm run dev` — test affected pages in light + dark mode
3. **E2E tests:** `npm run test:e2e` (see Section H for prerequisites)

### A.4 Promoting to Production

Use `/mi-promote` or follow `migration/promotion-runbook.md`.

- [ ] On `main` branch, clean working tree
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Feature verified on dev (localhost or personal Vercel)
- [ ] Review promotion diff: `git log production/main..main --oneline`
- [ ] `git push production main`
- [ ] Deploy: swap Vercel config → `npx vercel --prod` → restore config
- [ ] Verify on `https://dashboard-jet-seven-93.vercel.app`

### A.5 Post-Promotion Verification

- [ ] Login works
- [ ] Scorecard shows data (not empty)
- [ ] Ask Blarney returns answers
- [ ] Any changed feature works correctly
- [ ] Slack send works (if applicable)

---

## B. Environment Configuration Management

### B.1 Adding a New Environment Variable

- [ ] Add to code with fallback: `process.env.NEW_VAR ?? "default"`
- [ ] Add to `.env.local` (dev value)
- [ ] Add to `.env.example` with description
- [ ] Add to `scripts/validate-env.mjs` (appropriate tier: REQUIRED/FEATURE/OPTIONAL)
- [ ] Add to production Vercel: swap to company config → `npx vercel env add <VAR> production`
- [ ] Add to dev Vercel (if using deployed dev): same process with personal config
- [ ] Update `migration/environments.md` env var table
- [ ] Update `migration/sop.md` quick reference (if it differs between envs)

### B.2 Changing an Existing Value

1. Determine scope: dev only, prod only, or both
2. Update `.env.local` for dev
3. Update Vercel for deployed changes (specify which project)
4. Restart dev server to pick up changes
5. Redeploy Vercel if needed

### B.3 Rotating API Keys

1. Generate new key in provider dashboard
2. Update `.env.local` (dev)
3. Update BOTH Vercel projects (dev + prod)
4. If used by n8n: update n8n credentials (both prod and dev workflows)
5. Verify: hit an endpoint that uses the key
6. Revoke old key only AFTER verification
7. Keep both keys valid for at least 1 hour during rotation

### B.4 Dev/Prod Env Var Sync Audit

Run periodically to catch drift:
```bash
# Local vars
grep -oP '^[A-Z_]+' .env.local | sort

# Production Vercel vars
cp .migration/vercel-company-project.json .vercel/project.json
npx vercel env ls production
cp .migration/vercel-personal-project.json .vercel/project.json
```

Every var in `.env.example` must exist in both Vercel projects.

---

## C. Database Schema Changes

All schema changes must be applied to BOTH Supabase projects.

### C.1 Process

1. Write the SQL (CREATE TABLE, ALTER TABLE, CREATE VIEW, etc.)
2. Test on dev Supabase first (`burcfsxsxgabknmodsrd`)
3. Verify app works with the change on dev
4. Apply SAME SQL to production Supabase (`cxrjlmquzhfueqrudiuy`)
5. Save SQL to `migration/sql/<YYYY-MM-DD>-<description>.sql`
6. Update `docs/03-database-schema.md`
7. Update seed scripts if columns changed (`scripts/seed-dev.mjs` line 58-72)
8. Update TypeScript types if applicable (`src/types/`)

### C.2 Checklist

- [ ] SQL tested on dev Supabase
- [ ] App verified on dev
- [ ] SQL applied to production Supabase
- [ ] App verified on production
- [ ] SQL saved to `migration/sql/`
- [ ] Schema docs updated
- [ ] Seed scripts updated
- [ ] Types updated

### C.3 View Changes

The `meetings_list` view affects every list page. After modifying:
- Verify: scorecard, meeting feed, company pages, rep pages
- Check `src/lib/hooks/use-meetings-list.ts` column references

### C.4 RPC Changes

`match_meeting_chunks` affects RAG search. After modifying:
- Verify: Ask Blarney returns results
- Check `src/app/api/chat/route.ts` RPC call parameters

---

## D. n8n Pipeline Changes

### D.1 When to Activate Dev n8n

ONLY for pipeline changes: scoring prompts, new stage types, capture logic.
NEVER for dashboard-only changes (CRs 002-009 except CR-001).

### D.2 Testing Pipeline Changes

1. Verify dev workflows point to dev Supabase (credential: "Supabase Dev")
2. Activate the specific dev workflow you're testing
3. Trigger manually in n8n (do NOT schedule)
4. Inspect dev Supabase for results
5. **Deactivate immediately after testing**

### D.3 Promoting n8n Changes

n8n has no version control. Changes are manual:
1. Open the production workflow in n8n
2. Apply the same changes you tested on dev
3. Wait for next 8-hour cycle or trigger manually
4. Verify via System Health page on production dashboard

### D.4 Critical Rule

If dev n8n is left active, it processes the same Zoom meetings as production, doubling LLM costs. Always deactivate all MI-DEV workflows when done.

---

## E. LLM Configuration

### E.1 Current Setup

All 4 LLM routes use `process.env.CHAT_MODEL ?? "claude-sonnet-4-6"`:
- `/api/chat` (RAG streaming)
- `/api/actions/draft-email`
- `/api/actions/meeting-prep`
- `/api/actions/resummarize`

Plus the fallback note in `scripts/validate-env.mjs`. n8n MI|3 has its own model config (separate from dashboard env vars).

RULE: always use undated model aliases (`claude-sonnet-4-6`), never dated ids (`claude-sonnet-4-20250514`). Aliases float to the current snapshot; dated ids get retired by Anthropic and start returning 404. See E.4.

### E.2 Changing Model Version

1. Set `CHAT_MODEL=<new-model>` in `.env.local`
2. Test all 4 routes on dev
3. Update `CHAT_MODEL` in the prod Vercel project (`vercel env rm CHAT_MODEL production --yes && printf "<new-model>" | vercel env add CHAT_MODEL production`). Env change only applies on next deploy.
4. Update the code fallback default in all 4 route files + `scripts/validate-env.mjs`
5. If changing n8n's model: update MI|3 workflow separately

### E.3 Model Deprecation

When Anthropic retires a model id, the API returns `404 not_found_error: model: <id>` and every Claude-backed feature breaks at once.

1. Update the fallback default in code (all 4 route files + `scripts/validate-env.mjs`)
2. Update `CHAT_MODEL` env var in prod Vercel — the env var OVERRIDES the code default, so fixing code alone is NOT enough if the env var holds a dead id
3. Redeploy (env changes only take effect on the next deploy)
4. Verify: `curl -s -X POST https://dashboard-jet-seven-93.vercel.app/api/chat -H "Content-Type: application/json" -d '{"message":"test","history":[]}' -w "%{http_code}"` → expect HTTP 200 + `text/event-stream`, not 502
5. Test thoroughly — different models produce different score formats

### E.4 Incident: model id retired (2026-06-19)

- SYMPTOM: Ask Blarney shows "Something went wrong"; `/api/chat` returns 502. Vercel runtime logs show truncated "Anthropic API error".
- ROOT CAUSE: `claude-sonnet-4-20250514` was retired by Anthropic → `404 not_found_error`. All 4 routes shared this dead default; prod `CHAT_MODEL` env var also held the dead id (overrode any code change).
- DIAGNOSIS: reproduce by calling the SDK directly with the model id (bypasses app error masking) — `new Anthropic().messages.stream({model, ...}).withResponse()` surfaces the raw 404.
- FIX: switched to undated alias `claude-sonnet-4-6` in code + prod env var. Hardened `/api/chat` so permanent errors (400/401/403/404) return 500 "contact admin" + log status/request_id instead of masking as 502 "try again".
- LESSON: never hardcode dated model ids; use aliases. When a Claude feature breaks broadly, suspect a retired model id first.

---

## F. Data Management

### F.1 Seeding Dev from Production

Use `/mi-seed-dev` or manually:
```bash
node scripts/seed-dev.mjs        # Tables (305 meetings, 1851 chunks, 32 users)
node scripts/seed-embeddings.mjs  # Vector embeddings (for RAG search)
```

Requires `.migration/env-production` file with production Supabase credentials.

### F.2 Re-seeding After Schema Changes

If columns were added/removed, update the SELECT list in `scripts/seed-dev.mjs` (line 58-72) before re-seeding.

### F.3 Data Freshness

Dev data ages because dev n8n is dormant. Re-seed when:
- Data is >7 days old (`/mi-env-check` warns about this)
- Production has significantly more meetings
- You need current data for testing

### F.4 When NOT to Seed

- After schema-breaking changes (fix seed script first)
- During active n8n dev testing (seed would overwrite dev-generated data)
- `chat_analytics` and `meeting_notes` are preserved during seeding (not truncated)

---

## G. Incident Response

See `migration/emergency-rollback.md` for full commands.

**Quick reference:**

| Scenario | First Action |
|----------|-------------|
| Bad code deployed | `git push production <good-sha>:main --force` + redeploy |
| Database broken | Fix SQL in Supabase SQL Editor |
| API key expired | Generate new key, update both Vercels + .env.local |
| n8n stalled | Check execution history, run MI\|0 for Zoom token |

**Post-incident:** Always identify root cause, fix on dev, test, promote normally.

---

## H. Testing Protocol

### H.1 Unit Tests

```bash
npm test                    # All tests
npx vitest run src/__tests__/lib/    # Just utilities
npx vitest run src/__tests__/api/    # Just API routes
```

Tests mock external services (Anthropic, Supabase). No real API calls.

### H.2 E2E Tests

**Prerequisites (must all be true):**
- [ ] Playwright installed: `npx playwright install chromium`
- [ ] Dev server running on port 3000: `npm run dev`
- [ ] `.env.local` points to dev Supabase
- [ ] Dev Supabase has seeded data
- [ ] `TEST_EMAIL` and `TEST_PASSWORD` in `.env.local` match a dev Supabase auth user

```bash
npm run test:e2e
```

### H.3 Manual Verification by Feature Type

| Change Type | What to Check |
|-------------|---------------|
| Score display | Meeting detail for all 4 stages (discovery, follow_up, onboarding, internal) |
| Filter/sort | State persists on navigation, reset works |
| API route | Valid input, invalid input, missing auth, large payload |
| Supabase query | Compare results with raw SQL in Supabase Editor |
| Slack feature | Send to `#meeting-intel-dev`, verify Block Kit formatting |

### H.4 Pre-Promotion Test Battery

- [ ] `npm test` — all tests pass
- [ ] `npm run build` — succeeds (includes env validation)
- [ ] Visual check on localhost — light + dark mode
- [ ] E2E tests (if auth or navigation changed)

---

## I. Onboarding a New Developer

### I.1 Access Needed

- [ ] GitHub: both repos (neerajkumar-builds + say2neeraj)
- [ ] Supabase: both projects (as Editor)
- [ ] Vercel: both projects (as Developer)
- [ ] n8n: for pipeline work only
- [ ] Slack workspace
- [ ] Anthropic + Gemini API keys

### I.2 Local Setup

```bash
git clone https://github.com/say2neeraj/fullfunnel-meeting-intel.git dashboard
cd dashboard
git remote add production https://github.com/neerajkumar-builds/meeting-intelligence-agent.git
npm install
cp .env.example .env.local  # Fill in dev values
npm run dev                  # Verify on localhost:3000
npx playwright install chromium  # For E2E tests
```

### I.3 Essential Reading

1. `ARCHITECTURE.md` — system overview
2. `migration/sop.md` — you are here
3. `migration/environments.md` — dev/prod details
4. `docs/03-database-schema.md` — database reference

### I.4 Where to Find What

| Looking for | Location |
|-------------|----------|
| Pages | `src/app/<route>/page.tsx` |
| API routes | `src/app/api/<route>/route.ts` |
| Components | `src/components/` |
| Hooks | `src/lib/hooks/` |
| Types | `src/types/` |
| Utils | `src/lib/utils/` |
| Tests | `src/__tests__/` |
| Claude skills | `.claude/commands/mi-*.md` |
| Migration docs | `migration/` |
| Local ops data | `.migration/` (gitignored) |
| Change requests | `migration/change-requests.json` |

---

## Maintenance

This SOP should be updated when:
- A new service is integrated
- A new env var is added (Section B)
- A new table is created (Section C)
- The deployment process changes
- An incident reveals a missing procedure (Section G)

Use `/mi-sop` to get context-aware guidance from this document.
