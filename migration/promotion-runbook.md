# Promotion Runbook: Dev to Production

## When to Promote

Promote when:
- Feature is verified on the dev URL
- `npm test` and `npm run build` pass
- You're confident the change is ready for users

## Steps

### 1. Verify you're on main with clean state

```bash
cd dashboard
git checkout main
git status  # should be clean
```

### 2. Run tests and build

```bash
npm test
npm run build
```

Both must pass. Do not skip.

### 3. Review what's being promoted

```bash
git fetch production main
git log production/main..main --oneline
```

Read each commit. Make sure you're not promoting unfinished work.

### 4. Push to production

```bash
git push production main
```

Company Vercel auto-deploys from the `main` branch.

### 5. Verify on production URL

Wait 1-2 minutes for Vercel to deploy, then check:
- [ ] Login works
- [ ] Scorecard shows real data
- [ ] Ask Blarney returns answers
- [ ] Any new feature works as expected

### 6. Log the promotion

The `/mi-promote` skill does this automatically. If promoting manually:

```bash
echo "[$(date '+%Y-%m-%d %H:%M')] Promoted $(git rev-parse --short HEAD) to production" >> .migration/promotions.log
```

## Rollback

If production is broken after promotion:

```bash
# Find the last known good commit
git log production/main --oneline

# Reset production to that commit
git push production <good-commit-sha>:main --force
```

This is destructive — only use if production is actually broken.

## Skill Shortcut

Run `/mi-promote` to execute this entire runbook with safety checks.
