---
name: mi-env-check
description: Verify Meeting Intelligence dev and prod environment health. Checks git remotes, current branch, environment variables, Supabase connectivity and data freshness, and reports unpromoted commits. Use at the start of any session, after environment changes, or when something seems wrong. Trigger on "check environment", "env status", "is everything working", "health check", "verify setup".
---

# Environment Health Check

Reports the health of both dev and prod environments. No arguments needed.

## Steps

### 1. Git state

```bash
cd dashboard
git rev-parse --abbrev-ref HEAD                    # Current branch
git status --porcelain | wc -l                     # Uncommitted changes count
git remote -v                                       # List remotes
```

Check that both remotes exist:
- `origin` -> personal GitHub (dev)
- `production` -> company GitHub (prod)

If `production` remote is missing, warn: "Production remote not configured. Run: `git remote add production <url>`"

Check for unpromoted commits:
```bash
git fetch production main 2>/dev/null
git log production/main..main --oneline 2>/dev/null | wc -l
```

### 2. Local environment

Read `.env.local` and check `NEXT_PUBLIC_SUPABASE_URL`:
- If it contains `cxrjlmquzhfueqrudiuy` -> WARNING: connected to PRODUCTION Supabase locally
- Otherwise -> Connected to dev Supabase (expected)

Also check that these required variables exist in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`

### 3. Dev Supabase health

Query dev Supabase (use Supabase MCP if available, otherwise note that manual check is needed):

```sql
SELECT COUNT(*) as meeting_count FROM scored_meetings;
SELECT COUNT(*) as chunk_count FROM meeting_chunks;
SELECT COUNT(*) as user_count FROM zoom_users;
SELECT MAX(scored_at) as last_scored FROM scored_meetings;
SELECT MAX(run_completed_at) as last_pipeline_run FROM scoring_run_log;
```

Calculate data age: days since `last_scored`.

### 4. Production status

Check `.promotions.log` for last promotion date and SHA (if file exists).

### 5. Report

Format the output:

```
MEETING INTELLIGENCE - Environment Status
==========================================

GIT
  Branch:       main
  Clean:        yes (no uncommitted changes)
  Remotes:      origin (personal) + production (company)
  Unpromoted:   3 commits ahead of production

DEV ENVIRONMENT
  Supabase:     <dev-project-url> (correct)
  Meetings:     76 rows
  Chunks:       611 rows
  Users:        5 rows
  Data age:     2 days (last scored: 2026-05-01)
  Pipeline:     Last run: 2026-05-01 (dev n8n dormant - expected)

PRODUCTION
  Last promoted: 2026-04-30 (sha: 40e1e9e)
  Commits behind: 3

WARNINGS
  - 3 unpromoted commits (run /mi-promote when ready)
  - Dev data is 2 days old (run /mi-seed-dev to refresh)
```

Only show WARNINGS section if there are actual warnings. Possible warnings:
- Connected to production Supabase locally
- Uncommitted changes
- Unpromoted commits
- Stale data (>7 days)
- Missing remotes
- Missing env vars
