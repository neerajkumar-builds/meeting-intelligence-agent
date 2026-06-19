# Prism Dashboard (formerly Meeting Intelligence)

## What This Is
Sales meeting scoring platform. Zoom recordings → n8n (5 workflows, 8h cycle) → Supabase (AI scoring with 6 LLM chains) → Next.js 16 dashboard with RAG search.
580+ meetings, 306 completed, 17 tracked users across 7 classifications. Live in production with daily active users.
Ask Blarney (RAG chat) has ChartErrorBoundary + value normalization for LLM-generated chart data.
LLM model: `claude-sonnet-4-6` (undated alias) in all 4 Claude routes + prod `CHAT_MODEL` env var. NEVER use dated model ids - they get retired by Anthropic (404). See migration/sop.md §E.
Product name: **Prism** (formerly Meeting Intelligence/MIA/Cipher). Part of portfolio: Prism, Current, Beacon, Pulse.
6 stage types: discovery_scoping, follow_up, onboarding, client_meeting, internal_client_meeting, internal. ALL actively assigned.
CS meetings scored with Stephen's 6-category rubric. Internal meetings scored with 4+2 category rubric.
n8n MI|2 uses 8-theme AI prompt. MI|3 uses host-role-aware classification from zoom_users. All 12 model nodes set to max_tokens=8192.
MI|3 Score CS prompt hardened with JSON-only header. Process Scores has JSON regex fallback for parse failures.
CRs 001-009 complete (revision 1). CRs 010-016 documented (revision 2). CR-012 + CR-013 + CR-011 (notifications) + CR-015 (pipeline triggers) implemented.
Prism Slack digests: Mon priorities/Tue-Thu actions/Fri review to #mi-sales, #mi-cs, #mi-internal. Digests filter status='completed' (no scoring_failed). Slack bot name: Prism.
detect_pipeline_triggers() SQL function filters status='completed' (no false alerts from scoring_failed).
Notification settings UI at /settings. All 3 sections set to daily frequency. Pipeline trigger detection live.
RLS on scored_meetings currently DISABLED (was blocking n8n pipeline). Re-enable deferred (last attempt broke pipeline 6 days).

## Environments

**CRITICAL: Always verify Supabase project_id before ANY database operation.**

| | Production | Development |
|--|-----------|-------------|
| **Supabase ID** | **`cxrjlmquzhfueqrudiuy`** | **`burcfsxsxgabknmodsrd`** |
| Supabase name | project_n8n | FF_Internal_Initiatives |
| Data | 526+ meetings, 17 users (LIVE) | 42 meetings, 13 users |
| GitHub | `neerajkumar-builds/meeting-intelligence-agent` | `say2neeraj/fullfunnel-meeting-intel` |
| Git remote | `production` | `origin` |
| Vercel | `dashboard-jet-seven-93.vercel.app` | localhost:3003 |
| n8n | MI\|0-4 active (8h cycle) | MI-DEV\|1-4 dormant |
| .env.local | N/A (Vercel env vars) | Points here |

### Environment Safety Rules
- `.env.local` points to DEV Supabase - local `next dev` always hits dev
- Vercel production env vars point to PROD Supabase - deployed app hits prod
- **Test ALL schema changes on DEV first**, then apply identical SQL to PROD
- **Never write to PROD Supabase** without testing on DEV and getting confirmation
- **Never activate MI-DEV n8n workflows** without deactivating after testing
- Reference: `migration/env-reference.md` for full details

### Supabase MCP Quick Check
```
DEV  = burcfsxsxgabknmodsrd  (safe to experiment)
PROD = cxrjlmquzhfueqrudiuy  (verify before writes)
```

## Mandatory Rules

1. **At session start:** Run `/mi-session-init` - loads CR status, env health, in-progress work
2. **Before ANY code change:** Read `migration/knowledge-graph.yaml` - understand which pages, components, hooks, and tables are affected
3. **Before ANY CR:** Run `/mi-cr-start <CR-ID>` - creates branch, checkpoint, shows blast radius
4. **Before promoting to prod:** Run `/mi-promote` - tests, builds, shows diff, deploys
5. **If unsure about procedure:** Run `/mi-sop <topic>` - shows relevant checklist
6. **Never modify production Supabase directly** - test on dev first, apply same SQL to prod
7. **Never leave dev n8n active** - deactivate after testing
8. **Always show impact brief** before coding - list affected pages, components, hooks, tables, corner cases
9. **Before ANY Supabase MCP call** - confirm project_id matches intended environment
10. **Ask before deploying** - no GitHub push or Vercel deploy without confirmation

## Current CR Status

Read from `project_tracker` table in dev Supabase (`burcfsxsxgabknmodsrd`):
```sql
SELECT reference_id, status, title FROM project_tracker WHERE type = 'cr_status' ORDER BY (details->>'implementation_order')::int;
```

Or read `migration/change-requests.json` for full CR details.

## Available Skills (10)

| Skill | When to use |
|-------|-------------|
| `/mi-session-init` | Start of every session |
| `/mi-env-check` | Verify dev/prod health |
| `/mi-cr-start <CR>` | Begin a change request |
| `/mi-cr-complete <CR>` | Finish and merge a CR |
| `/mi-promote` | Deploy to production |
| `/mi-checkpoint <label>` | Snapshot before risky changes |
| `/mi-rollback <label>` | Undo to a checkpoint |
| `/mi-seed-dev` | Refresh dev data from prod |
| `/mi-sop <topic>` | Show procedure checklist |
| `/mi-env-check` | Environment health report |

## Key Docs

| Doc | Purpose |
|-----|---------|
| `migration/knowledge-graph.yaml` | Component dependency map — READ BEFORE ANY CHANGE |
| `migration/sop.md` | Full SOP (9 sections: workflow, env, schema, n8n, LLM, data, incidents, testing, onboarding) |
| `migration/env-reference.md` | Dev/prod Supabase IDs, data state, safety checklist |
| `migration/environments.md` | Dev/prod env var mappings |
| `migration/emergency-rollback.md` | Incident response commands |
| `migration/session-handover.md` | What happened last session |
| `migration/continuation-prompt.md` | Prompt to paste in new sessions |
| `migration/change-requests.json` | CRs 001-009 details (revision 1) |
| `change_requests/revision_2/` | CRs 010-016 (revision 2, from 2026-05-12 meeting) |
| `docs/03-database-schema.md` | Supabase schema reference |
| `docs/n8n-session5-changes.md` | Score CS fix guide (prompt + JSON fallback + max_tokens) |
| `src/components/search/chart-error-boundary.tsx` | React Error Boundary for Ask Blarney charts |

## Supabase Project Tracker

The `project_tracker` table in dev Supabase stores CR status, session logs, and decisions.
Query it at session start to know what's been done and what's next:
```sql
SELECT type, reference_id, status, title, created_at 
FROM project_tracker 
ORDER BY created_at DESC LIMIT 20;
```

## Tech Stack
Next.js 16 + React 19 + TypeScript + Tailwind 4 + shadcn/ui + Supabase (pgvector) + Anthropic Claude + Google Gemini + Recharts

## Build
```bash
npm run build    # Includes env validation (scripts/validate-env.mjs)
npm test         # 91 tests (Vitest)
npm run test:e2e # Playwright E2E (needs dev server running)
```

@AGENTS.md
