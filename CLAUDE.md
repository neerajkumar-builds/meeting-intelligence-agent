# Meeting Intelligence Dashboard

## What This Is
Sales meeting scoring platform. Zoom recordings → n8n (5 workflows, 8h cycle) → Supabase (AI scoring with 4 LLMs) → Next.js 16 dashboard with RAG search.
305 meetings, 1851 transcript chunks, 32 users. Live in production with daily active users.

## Environments

| | Production | Development |
|--|-----------|-------------|
| GitHub | `neerajkumar-builds/meeting-intelligence-agent` | `say2neeraj/fullfunnel-meeting-intel` |
| Git remote | `production` | `origin` |
| Vercel | `dashboard-jet-seven-93.vercel.app` | localhost / personal Vercel |
| Supabase | `cxrjlmquzhfueqrudiuy` (project_n8n) | `burcfsxsxgabknmodsrd` (FF_Internal_Initiatives) |
| n8n | MI\|0-4 active (8h cycle) | MI-DEV\|1-4 dormant |

## Mandatory Rules

1. **At session start:** Run `/mi-session-init` — loads CR status, env health, in-progress work
2. **Before ANY code change:** Read `migration/knowledge-graph.yaml` — understand which pages, components, hooks, and tables are affected
3. **Before ANY CR:** Run `/mi-cr-start <CR-ID>` — creates branch, checkpoint, shows blast radius
4. **Before promoting to prod:** Run `/mi-promote` — tests, builds, shows diff, deploys
5. **If unsure about procedure:** Run `/mi-sop <topic>` — shows relevant checklist
6. **Never modify production Supabase directly** — test on dev first, apply same SQL to prod
7. **Never leave dev n8n active** — deactivate after testing
8. **Always show impact brief** before coding — list affected pages, components, hooks, tables, corner cases

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
| `migration/environments.md` | Dev/prod details |
| `migration/emergency-rollback.md` | Incident response commands |
| `migration/session-handover.md` | What happened last session |
| `migration/continuation-prompt.md` | Prompt to paste in new sessions |
| `migration/change-requests.json` | All 9 CRs with details |
| `docs/03-database-schema.md` | Supabase schema reference |

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
npm test         # 77+ tests (Vitest)
npm run test:e2e # Playwright E2E (needs dev server running)
```

@AGENTS.md
