---
name: mi-seed-dev
description: Re-seed the Meeting Intelligence dev Supabase from production data. Exports scored_meetings, meeting_chunks, zoom_users, and scoring_run_log from production and imports into dev. Preserves dashboard-owned tables (chat_analytics, meeting_notes). Has safety checks to prevent writing to production. Use when dev data is stale or after setting up a new dev Supabase project. Trigger on "seed dev", "refresh dev data", "sync dev from prod", "dev data is stale", "populate dev".
---

# Re-seed Dev Supabase from Production

Safely copies n8n-owned data from production Supabase to dev Supabase. Dashboard-owned tables (chat_analytics, meeting_notes) are NOT touched.

## Safety-Critical: Read Carefully

This skill writes to the dev database. Multiple safety checks prevent accidental writes to production:
1. `.env.local` must NOT point to production
2. `.env.production` provides read-only production credentials
3. Only n8n-owned tables are truncated in dev
4. User must confirm before any destructive operation

## Steps

### 1. Safety check: verify local env points to dev

Read `NEXT_PUBLIC_SUPABASE_URL` from `.env.local`:

```bash
grep NEXT_PUBLIC_SUPABASE_URL .env.local
```

If it contains `cxrjlmquzhfueqrudiuy` (production project ref):
**ABORT IMMEDIATELY.** Print: "SAFETY ABORT: .env.local points to PRODUCTION Supabase. This skill only writes to dev. Fix .env.local first."

### 2. Load production credentials

Check for `.env.production` in the dashboard directory:

```bash
test -f .env.production && echo "EXISTS" || echo "MISSING"
```

If missing, ask user to create it:
```
Create dashboard/.env.production with:
PROD_SUPABASE_URL=https://cxrjlmquzhfueqrudiuy.supabase.co
PROD_SUPABASE_SERVICE_KEY=<production service_role key from Supabase dashboard>

This file is in .gitignore and will never be committed.
```

### 3. Confirm with user

```
This will:
- TRUNCATE scored_meetings, meeting_chunks, zoom_users, scoring_run_log in DEV Supabase
- COPY all rows from production for those 4 tables
- NOT touch chat_analytics or meeting_notes (your dev notes are safe)

Continue? [y/n]
```

### 4. Export from production

Use Supabase MCP tools or direct API calls to read from production. For each table:
- `scored_meetings`: all rows
- `meeting_chunks`: all rows  
- `zoom_users`: all rows
- `scoring_run_log`: last 20 rows (ordered by run_completed_at DESC)

### 5. Import to dev

For each n8n-owned table in dev Supabase:
1. `TRUNCATE TABLE <table_name> CASCADE;`
2. Insert all exported rows

The `meetings_list` view auto-updates since it derives from `scored_meetings`.

### 6. Verify

Run verification queries on dev:
```sql
SELECT COUNT(*) FROM scored_meetings;
SELECT COUNT(*) FROM meeting_chunks;
SELECT COUNT(*) FROM zoom_users;
```

Also test RAG search:
```sql
SELECT id, similarity FROM match_meeting_chunks('<any-embedding-text>', 3);
```

If row counts match production and RPC returns results, the seed is successful.

### 7. Log

Print summary:
```
Dev Supabase seeded from production
  scored_meetings: <N> rows
  meeting_chunks:  <N> rows  
  zoom_users:      <N> rows
  scoring_run_log: <N> rows
  Source snapshot:  <date>
```
