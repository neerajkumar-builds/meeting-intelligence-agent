# Environment Reference

## RULE: Always verify which environment before ANY database operation

| Environment | Supabase Project ID | Supabase URL | n8n Workflows | Dashboard |
|-------------|-------------------|--------------|---------------|-----------|
| **DEV** | `burcfsxsxgabknmodsrd` | burcfsxsxgabknmodsrd.supabase.co | MI-DEV\|1-4 (dormant) | localhost:3003 |
| **PROD** | `cxrjlmquzhfueqrudiuy` | cxrjlmquzhfueqrudiuy.supabase.co | MI\|0-4 (active, 8h cycle) | dashboard-jet-seven-93.vercel.app |

## Local Development (.env.local)

Points to **DEV** Supabase. This is correct.

```
NEXT_PUBLIC_SUPABASE_URL=https://burcfsxsxgabknmodsrd.supabase.co
```

## Vercel Production

Env vars set in Vercel dashboard, point to **PROD** Supabase.

## Dev Supabase Data

- 9 seed meetings (3 discovery, 2 follow-up, 2 onboarding, 2 internal)
- Seeded 2026-05-13 from production data samples
- To refresh: re-seed from production (do NOT activate MI-DEV n8n workflows)

## Tables on Each Environment

| Table | DEV | PROD |
|-------|-----|------|
| scored_meetings | YES (9 seed rows) | YES (373 rows) |
| meetings_list (view) | YES | YES |
| meeting_chunks | YES (empty) | YES (1851 chunks) |
| scoring_run_log | YES (empty) | YES |
| zoom_users | YES (empty) | YES |
| user_roles | YES (4 test users) | YES (8 users) |
| chat_analytics | YES (empty) | YES |
| meeting_notes | YES (empty) | YES |
| scoring_config | YES (6 rows) | YES (6 rows) |

## Safety Checklist

Before ANY Supabase operation:
1. Confirm project_id matches intended environment
2. `burcfsxsxgabknmodsrd` = DEV (safe to experiment)
3. `cxrjlmquzhfueqrudiuy` = PROD (verify before write operations)
4. Test schema changes on DEV first, apply identical SQL to PROD after verification
5. Never activate MI-DEV n8n workflows without deactivating after testing
