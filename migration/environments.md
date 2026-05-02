# Environment Registry

## Production (Company Accounts)

| Component | Value |
|-----------|-------|
| **GitHub** | `neerajkumar-builds/meeting-intelligence-agent` |
| **Vercel** | Project `prj_Mu9agcZ5TZA8ng4d5li5yCaJTWyN`, team `neerajkumar-builds` |
| **Vercel URL** | https://dashboard-jet-seven-93.vercel.app |
| **Supabase** | `cxrjlmquzhfueqrudiuy.supabase.co` |
| **n8n Workflows** | MI\|0 through MI\|4 (active, 8-hour cycle) |
| **Slack Channels** | Production channels |

## Development (Personal Accounts)

| Component | Value |
|-----------|-------|
| **GitHub** | `say2neeraj/fullfunnel-meeting-intel` |
| **Vercel** | Project `prj_3sbGLoNzzEAXAOGorABwnFf61Oqm` |
| **Vercel URL** | _Current personal URL_ |
| **Supabase** | `burcfsxsxgabknmodsrd` — `https://burcfsxsxgabknmodsrd.supabase.co` (FF_Internal_Initiatives) |
| **n8n Workflows** | MI\|0-DEV through MI\|4-DEV (dormant) |
| **Slack Channels** | `#meeting-intel-dev` |

## Environment Variables

| Variable | Production | Development |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `cxrjlmquzhfueqrudiuy.supabase.co` | `burcfsxsxgabknmodsrd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production key | Dev key |
| `ANTHROPIC_API_KEY` | Shared | Shared |
| `GEMINI_API_KEY` | Shared | Shared |
| `CHAT_MODEL` | `claude-sonnet-4-20250514` | Same |
| `SLACK_WEBHOOK_URL` | Production webhook | Same (different allowed channels) |
| `SLACK_BOT_TOKEN` | Shared | Shared |
| `SLACK_ALLOWED_CHANNELS` | Production channels | `meeting-intel-dev` |
| `NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS` | `8` | `24` |
| `DAILY_QUERY_LIMIT` | `50` | `200` |
| `BURST_QUERY_LIMIT` | `10` | `50` |

## Promotion Flow

```
dev (personal GitHub) ----> personal Vercel
        |
        |  git push production main (manual)
        v
prod (company GitHub) ----> company Vercel (auto-deploy)
```
