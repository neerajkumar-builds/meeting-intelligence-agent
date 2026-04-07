# 05 - Escalation & Emergency Reference

**Last updated:** 2026-04-07

## Purpose

Quick reference for "what do I do if X breaks." Bookmark this for emergencies.

---

## System Owners

| System | Owner | Notes |
|--------|-------|-------|
| Meeting Intelligence Dashboard (this project) | Neeraj Kumar (Director GTM Engineering, FullFunnel) | Primary engineer and product owner |
| n8n pipeline (5 workflows) | Neeraj Kumar / FullFunnel ops | n8n cloud-hosted, 8hr cycle |
| Supabase project | Neeraj Kumar | Project ID: `cxrjlmquzhfueqrudiuy` |
| Vercel deployment | Neeraj Kumar | Project ID: `prj_3sbGLoNzzEAXAOGorABwnFf61Oqm`, project name `dashboard` |

## Production URLs

- **Production dashboard:** https://dashboard-chi-blue-6ybimqrfjv.vercel.app
- **GitHub repo:** https://github.com/say2neeraj/fullfunnel-meeting-intel (private)
- **Supabase project:** `cxrjlmquzhfueqrudiuy`

---

## What To Do If X Breaks

### Dashboard returns 500 error / white screen

1. Check Vercel dashboard → Deployments → see if latest deploy is "Ready" or "Error"
2. If latest deploy errored: roll back to previous green deploy
   - Vercel dashboard → Deployments → previous deploy → "Promote to Production"
3. If latest deploy is "Ready" but the app is broken at runtime:
   - Check Vercel function logs for errors
   - Check browser console for errors
   - Check Supabase status page (https://status.supabase.com)
   - Check Anthropic status (https://status.anthropic.com)
4. If still broken, the issue is likely in the code - revert the most recent commit:
   ```bash
   git revert HEAD
   git push
   ```

### Dashboard loads but data is missing/wrong

1. Check Supabase status (https://status.supabase.com)
2. Check the browser console - any failing API calls?
3. Check Vercel function logs for the failing route
4. Check if n8n pipeline is running (n8n cloud dashboard)
5. If n8n stopped, new meetings won't be ingested but existing data should still display

### "Ask Blarney" / AI features broken

1. Check Anthropic status (https://status.anthropic.com)
2. Check Vercel function logs for `/api/chat` route - look for API errors
3. Check rate limit - have you used 50 queries today?
4. If Anthropic is down: data views (scorecard, meetings, etc.) should still work
5. The error message in the chat will show what failed

### Slack notifications not working

1. Test with a manual API call
2. Check `/api/slack/channels` returns the channel list - if not, `SLACK_BOT_TOKEN` env var may be wrong
3. Check `/api/notifications/slack` Vercel function logs
4. Verify the Slack webhook URL or bot token is still valid in Vercel env vars
5. Falls back to webhook if bot token fails - check both

### n8n pipeline stopped processing meetings

This is OUTSIDE the scope of the dashboard repo. The dashboard reads what n8n writes.

1. Open n8n cloud dashboard
2. Check the 5 MI workflows (MI|0 through MI|4) - all should be active
3. Check execution history for errors
4. Restart workflows if needed
5. **The dashboard will continue to function** with whatever data was already in Supabase. Only NEW meetings will be missing.

### Login broken

1. Check Supabase Auth status (https://status.supabase.com)
2. Try in incognito mode (rule out cached cookies)
3. Check browser console for auth errors
4. Try password reset via Supabase admin (no self-service reset exists - see `docs/10-corner-cases.md`)
5. If middleware was just changed, possibly auth is rejecting valid sessions - rollback the middleware change

### Production deploy is in a build loop / can't deploy at all

1. Vercel dashboard → Deployments
2. Find the most recent "Ready" (green) deploy
3. Click → "Promote to Production"
4. Production is now stable
5. Diagnose the build issue locally without pushing
6. Once fixed, push the fix

---

## Emergency Rollback (Vercel)

The fastest way to fix a production issue is rolling back via Vercel:

1. https://vercel.com/dashboard
2. Select the `dashboard` project
3. Click "Deployments" tab
4. Find the previous "Ready" deploy that you trust
5. Click the "..." menu → "Promote to Production"
6. Wait ~30 seconds for the promotion to complete
7. Hard-refresh the production URL

This is faster than git revert and doesn't require any code changes.

---

## Where To Find Logs

| What | Where |
|------|-------|
| Vercel function errors (API routes) | Vercel dashboard → Project → Logs |
| Vercel build errors | Vercel dashboard → Project → Deployments → click deploy → "Build Logs" |
| Browser-side errors | Browser DevTools → Console |
| Network errors | Browser DevTools → Network |
| Supabase query errors | Supabase dashboard → Logs |
| Auth errors | Supabase dashboard → Authentication → Logs |
| n8n workflow errors | n8n cloud dashboard → Executions |

---

## Critical Production Safety Rules (From `../10-corner-cases.md`)

These are repeated here for emergency reference:

1. **NEVER write to Supabase n8n tables:**
   - `meetings`
   - `scored_meetings`
   - `meeting_chunks`
   - `scoring_run_log`
   - `zoom_users`
   
   The dashboard READS from these. n8n WRITES to them. Modifying them corrupts the pipeline.

2. **The dashboard ONLY writes to two tables:**
   - `chat_analytics` (fire-and-forget logging)
   - `meeting_notes` (user-added notes)
   
   These are owned by the dashboard.

3. **Analytics writes are fire-and-forget.** They never block user actions. If they fail silently, that's OK.

4. **Rate limits fail open.** If the rate limit check itself fails, queries proceed. This is intentional but a known risk (finding F07).

5. **Clear chat retains analytics.** When a user clears their chat, conversation is removed from UI but analytics data is permanently retained in `chat_analytics`. This is by design.

---

## Useful Commands

### Check project health

```bash
cd "/Users/neerajkumar/AI Automation Projects/Fullfunnel Intenal Initiatives/Meeting Intelligence/dashboard"

# Git status
git status
git log --oneline -5

# TypeScript health
npx tsc --noEmit && echo "TS clean"

# Test health
npx vitest run

# Build health
npm run build

# Dependency check
npm outdated
npm audit
```

### Vercel CLI (if installed)

```bash
# List deployments
vercel ls

# View logs for a specific deployment
vercel logs <deployment-url>
```

---

## Escalation Path

1. **First:** Check this document and `04-safety-process.md` rollback procedures
2. **Second:** Try the emergency Vercel rollback
3. **Third:** Diagnose locally, do not push to production until fixed
4. **Fourth:** If completely stuck, the system was designed to be resilient - rollback to a known-good state and take time to fix properly

**Never panic-push to production.** A short outage during which you fix something properly is better than a long outage from compounding rushed fixes.
