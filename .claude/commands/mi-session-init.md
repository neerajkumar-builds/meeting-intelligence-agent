---
name: mi-session-init
description: Initialize a Meeting Intelligence working session. Checks environment health, reports in-progress CRs, shows completed CRs, and suggests next work. Run this at the start of every session to get oriented. Trigger on "start session", "init", "where was I", "what's the status", "session start", or at the beginning of any Meeting Intelligence conversation.
---

# Session Initialization

Loads context and reports the current state of the Meeting Intelligence project. No arguments needed.

## Steps

### 0. Load context sources

Read these files to build full awareness:
- `CLAUDE.md` — auto-loaded, but verify you've read it
- `migration/knowledge-graph.yaml` — component dependency map
- `migration/session-handover.md` — what happened last session

Query `project_tracker` table in dev Supabase (`burcfsxsxgabknmodsrd`) via Supabase MCP:
```sql
SELECT type, reference_id, status, title, created_at 
FROM project_tracker 
ORDER BY created_at DESC LIMIT 20;
```

This gives you CR status, recent session logs, and key decisions — all in one query.

### 1. Quick environment check

Run an abbreviated version of `/mi-env-check`:

```bash
cd dashboard
git rev-parse --abbrev-ref HEAD
git status --porcelain | wc -l
grep NEXT_PUBLIC_SUPABASE_URL .env.local
```

Report: branch, clean/dirty, which Supabase (dev or prod).

If connected to production Supabase locally, warn immediately.

### 2. Check for in-progress work

```bash
git branch --list "cr-*"
```

For each CR branch found:
- How many commits ahead of main?
- Is it the currently checked-out branch?

If a CR branch exists, report: "In progress: <CR-ID> on branch <branch-name> (<N> commits ahead of main)"

Also check for uncommitted changes and report modified files.

### 3. Report CR status

Query `project_tracker` for current CR status:
```sql
SELECT reference_id, status, title FROM project_tracker 
WHERE type = 'cr_status' 
ORDER BY (details->>'implementation_order')::int;
```

Show completed, in_progress, and pending CRs.
Also read `migration/changelog-revision-1.md` for implementation details of completed CRs.

### 4. Determine next CR

From the tracker query results, find the first CR with status = 'pending'.

The implementation order from the plan is:
1. CR-004 (Critical, Compliance)
2. CR-005 (High, Score reasons)
3. CR-009 (High, Meeting detail refinement)
4. CR-006 (Medium, Watch recording)
5. CR-002 (High, Rep strengths summary)
6. CR-003 (Medium, Rep date range)
7. CR-007 (Medium, Intel panel enhancements)
8. CR-008 (Medium, MEDDIC/BANT)
9. CR-001 (Critical, Architecture - last because needs n8n)

Find the first uncompleted CR and suggest it.

### 5. Check unpromoted work

```bash
git fetch production main 2>/dev/null
git log production/main..main --oneline 2>/dev/null
```

If there are unpromoted commits, note them.

### 6. Print session summary

```
SESSION: Meeting Intelligence Dashboard
=========================================

ENVIRONMENT
  Branch: main | Clean: yes | Supabase: dev

IN PROGRESS
  None (or: CR-004 on branch cr-004-remove-internal, 3 commits)

COMPLETED CRs
  None yet (or: CR-004 (2026-05-10), CR-005 (2026-05-12))

NEXT UP
  CR-004: Remove internal meetings from analysis (Critical)
  Run: /mi-cr-start CR-004

UNPROMOTED
  2 commits ahead of production (run /mi-promote when ready)
```

Keep the output concise. The goal is to get oriented in under 10 seconds.
