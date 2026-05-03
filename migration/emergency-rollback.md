# Emergency Rollback Runbook

No theory. Just commands. Use when production is broken.

---

## Scenario 1: Bad Code Deployed to Production

```bash
cd dashboard

# 1. Find last good commit
git log production/main --oneline -10

# 2. Force push the good commit
git push production <good-sha>:main --force

# 3. Deploy to company Vercel
cp .migration/vercel-company-project.json .vercel/project.json
npx vercel --prod
cp .migration/vercel-personal-project.json .vercel/project.json

# 4. Verify
# Open https://dashboard-jet-seven-93.vercel.app
```

After stabilizing: `git revert <bad-commit>` on dev, test, re-promote normally.

---

## Scenario 2: Database Schema Broken

**Column added that breaks queries:**
```sql
-- Run in Supabase SQL Editor for the affected project
ALTER TABLE <table_name> DROP COLUMN <column_name>;
```

**View broken:**
```sql
-- Recreate from migration/sql/ or docs/03-database-schema.md
CREATE OR REPLACE VIEW meetings_list AS
SELECT id, topic, host_name, company_name, primary_participant_name,
       scoring_stage_type, start_time, duration_minutes, overall_score,
       client_health_score, meeting_summary, google_doc_url
FROM scored_meetings
WHERE status = 'completed'
ORDER BY start_time DESC;
```

**RPC broken:**
Recreate `match_meeting_chunks` from `docs/03-database-schema.md` Section "RPC Function".

**Dev Supabase broken:**
```bash
node scripts/seed-dev.mjs
node scripts/seed-embeddings.mjs
```

---

## Scenario 3: API Key Expired or Rate Limited

**Symptoms:** 401/429 errors in Vercel function logs, "AI service unavailable" in dashboard.

| Service | Check | Fix |
|---------|-------|-----|
| Anthropic | console.anthropic.com > Usage | Generate new key, update both Vercels + .env.local |
| Gemini | aistudio.google.com | Generate new key, update both Vercels + .env.local |
| Slack | api.slack.com/apps | Regenerate token, update both Vercels + .env.local |

**Update Vercel env var:**
```bash
cd dashboard
# For production:
cp .migration/vercel-company-project.json .vercel/project.json
printf '<new-key>' | npx vercel env rm <VAR_NAME> production && printf '<new-key>' | npx vercel env add <VAR_NAME> production
npx vercel --prod
cp .migration/vercel-personal-project.json .vercel/project.json
```

Revoke old key only AFTER verifying the new one works.

---

## Scenario 4: n8n Pipeline Stalled

**Check:** n8n execution history for error details.

| Cause | Fix |
|-------|-----|
| Zoom token expired | Run MI\|0 (Token Service) manually, then re-trigger failed workflow |
| Supabase creds rotated | Update n8n credential with new service_role key |
| LLM rate limit | Wait 1 hour, re-trigger |
| Supabase down | Check status.supabase.com, wait for recovery |

Dashboard shows "Synced Xh ago" indicator turning red when pipeline is stale.

---

## Post-Incident Checklist

- [ ] Production is back and verified working
- [ ] Root cause identified and documented
- [ ] Fix applied to dev and tested
- [ ] Fix promoted to production normally (not via force push)
- [ ] Update `migration/sop.md` if a procedure was missing
