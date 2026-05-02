---
name: mi-promote
description: Promote Meeting Intelligence code from dev to production. Use when ready to deploy tested changes to the company Vercel. Runs full pre-flight checks (git state, tests, build), shows promotion diff, pushes to company GitHub, and logs the promotion. Trigger on "promote", "deploy to prod", "push to production", "ship it".
---

# Dev to Production Promotion

This skill guides the promotion of tested code from dev (personal GitHub/Vercel) to production (company GitHub/Vercel). Every step must pass before proceeding.

## Context

The Meeting Intelligence Dashboard has two environments:
- **Dev**: personal GitHub (`origin`) -> personal Vercel
- **Prod**: company GitHub (`production`) -> company Vercel (auto-deploys)

Promotion = `git push production main` + Vercel CLI deploy with company config.

**Vercel configs** (both stored in `.migration/`):
- `.migration/vercel-company-project.json` — company Vercel (production)
- `.migration/vercel-personal-project.json` — personal Vercel (dev)
- `.vercel/project.json` — active config (normally points to dev)

## Steps

### 1. Pre-flight git checks

Run these checks and abort if any fail:

```bash
cd dashboard
git rev-parse --abbrev-ref HEAD   # Must be "main"
git status --porcelain             # Must be empty (no uncommitted changes)
git remote get-url production      # Must exist
```

If not on `main`: "Switch to main first: `git checkout main`"
If dirty working tree: "Commit or stash changes before promoting."
If no `production` remote: "Add it first: `git remote add production <company-github-url>`"

### 2. Run tests

```bash
npm test
```

Abort if any test fails. Report which tests failed.

### 3. Run build

```bash
npm run build
```

Abort if build fails. Report the error.

### 4. Show promotion diff

Fetch the latest from production and show what's being promoted:

```bash
git fetch production main 2>/dev/null
git log production/main..main --oneline
```

Count the commits. If zero: "Nothing to promote. Dev and prod are in sync."

Display the commit list and ask: "These N commits will be deployed to production. Proceed?"

### 5. Push to production GitHub

```bash
git push production main
```

### 6. Deploy to company Vercel

Swap the Vercel config to company, deploy, then restore dev config:

```bash
cp .vercel/project.json .vercel/project.json.dev-backup
cp .migration/vercel-company-project.json .vercel/project.json
npx vercel --prod
cp .vercel/project.json.dev-backup .vercel/project.json
rm .vercel/project.json.dev-backup
```

Wait for deployment to complete (shown in CLI output).

### 7. Post-promotion verification

Print this checklist for the user:
- Verify on production URL (https://dashboard-jet-seven-93.vercel.app):
  - [ ] Login works
  - [ ] Scorecard shows real data
  - [ ] Ask Blarney returns answers
  - [ ] Slack send works (if applicable)

### 8. Log the promotion

Append to `.migration/promotions.log`:

```
[YYYY-MM-DD HH:MM] Promoted <commit-sha> (<N> commits) to production
```
