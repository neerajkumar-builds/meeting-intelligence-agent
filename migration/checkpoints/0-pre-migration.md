# Checkpoint 0: Pre-Migration Baseline

**Created:** 2026-05-03
**Tag:** `checkpoint/pre-migration-2026-05-03`
**Purpose:** Capture stable state before dev/prod environment split

## Git State

- **Branch:** main
- **HEAD SHA:** `40e1e9eee0166db4f6a24f0fb225bb1475c32411` (before skill commit)
- **Post-skill SHA:** `6cd7e93` (after adding skills + CR JSON)
- **Remotes:**
  - `origin` -> `https://github.com/say2neeraj/fullfunnel-meeting-intel.git` (personal/dev)
  - `production` -> `https://github.com/neerajkumar-builds/meeting-intelligence-agent.git` (company/prod)

## Vercel (Personal — current production)

- **Project ID:** `prj_3sbGLoNzzEAXAOGorABwnFf61Oqm`
- **Org ID:** `team_jQ82pAl9nP2c6UEmRlFp3LmO`
- **Project Name:** dashboard

## Supabase (Production)

- **Project Ref:** `cxrjlmquzhfueqrudiuy`
- **URL:** `https://cxrjlmquzhfueqrudiuy.supabase.co`

## n8n Workflows (Production)

| Workflow | ID | Status |
|----------|-----|--------|
| MI\|0: Token Service | ENm8w8yEJGxL0yZT | Active |
| MI\|1: Capture + Sync | rBi3GeFd5MBkHX5W | Active |
| MI\|2: Transcript + Enrich | Eo6HPUD58cQc4miB | Active |
| MI\|3: Score Meetings | AQcneXfRxHdZICeZ | Active |
| MI\|4: Chunk + Embed | TCrG2S41dfp0kjZV | Active |

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
SLACK_WEBHOOK_URL
SLACK_BOT_TOKEN
SLACK_ALLOWED_CHANNELS
NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS=8
DAILY_QUERY_LIMIT=50
BURST_QUERY_LIMIT=10
BLOB_READ_WRITE_TOKEN
```

## Rollback

This is the baseline. No rollback needed — all subsequent checkpoints reference this state.

To restore code to this point: `git reset --hard checkpoint/pre-migration-2026-05-03`
