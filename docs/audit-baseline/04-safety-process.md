# 04 - Safety Process

**Last updated:** 2026-04-07

## Purpose

This document defines the **8-step verification stack** that runs after EVERY single change to the codebase, no exceptions. It also defines rollback procedures for when something goes wrong.

This is the contract: if any step in the safety stack fails, we STOP and either fix or revert. We never proceed past a red step.

---

## The 8-Step Safety Stack

Every change goes through these steps in order. If a step fails, fix or revert before continuing.

### Step 1: TypeScript Type Check

```bash
npx tsc --noEmit
```

**Expected:** No output (zero errors)
**If it fails:** Fix the type error or revert the change. Do not proceed.

### Step 2: Run Test Suite

```bash
npx vitest run
```

**Expected:** All tests pass. Total count must be at least the current baseline (77 at minimum, more after Phase 1 adds tests).
**If it fails:** Read the failing test output. Fix the bug or revert the change. Do not proceed.

### Step 3: Build Check

```bash
npm run build
```

**Expected:** Build completes successfully
**If it fails:** Read the build error. Common issues: import errors, missing dependencies, runtime references at build time. Fix or revert.

### Step 4: Local Visual Check

```bash
npm run dev
```

Then in the browser:
1. Visit the affected page in **light mode**
2. Visit the affected page in **dark mode**
3. Verify the change looks correct
4. Click through the affected feature end-to-end
5. Check the browser console for any errors

**Expected:** No visual regressions, no console errors
**If it fails:** Diagnose the visual issue. Check if you broke an existing feature. Fix or revert.

### Step 5: Git Commit

```bash
git add <specific files>
git commit -m "<descriptive message>"
```

**Rules:**
- Add specific files by name, never `git add .` or `git add -A` (avoids accidentally including .env or test-results)
- Use descriptive messages: `fix: <what>`, `feat: <what>`, `test: <what>`, `chore: <what>`, `docs: <what>`, `polish: <what>`
- Reference the finding number when relevant: `fix(F09): reps sorting null handling`
- Include `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` when Claude made the change

### Step 6: Push to Branch

```bash
git push origin <branch-name>
```

**Note:** For solo work on this project, pushing to `main` is acceptable since you're the only user. For multi-user work, use feature branches and PRs.

**Expected:** Push succeeds. Vercel automatically creates a preview deploy.

### Step 7: Smoke Test on Preview Deploy

1. Wait for Vercel to finish building (check Vercel dashboard or email notification)
2. Click the preview URL
3. Repeat the same checks from Step 4 (light + dark, end-to-end click-through, console errors)
4. Test in an actual mobile viewport (or DevTools mobile emulation)

**Expected:** Behavior on preview matches local
**If it fails:** Don't merge. Fix on the branch and re-push.

### Step 8: Production Deploy

If pushing to a feature branch:
1. Open a PR
2. Verify CI is green
3. Merge to main (Vercel auto-deploys to production)
4. Smoke test the production URL after deploy completes

If pushing directly to main (solo work):
1. The push to main IS the production deploy
2. Wait for Vercel build to complete
3. Smoke test the production URL

**Expected:** Production deploy is healthy, no user-facing breakage.

---

## Definition of Done (Per Change)

A change is DONE only when ALL 8 steps are green:

- [ ] Step 1: TypeScript clean
- [ ] Step 2: Tests pass (count >= baseline)
- [ ] Step 3: Build succeeds
- [ ] Step 4: Local visual check passed (light + dark)
- [ ] Step 5: Committed with descriptive message
- [ ] Step 6: Pushed to branch
- [ ] Step 7: Smoke test on preview passed
- [ ] Step 8: Production deploy healthy

If any step is incomplete, the change is NOT done. Don't move to the next fix until this one is fully done.

---

## What "Small Commit" Means

A "small commit" is:
- ONE file change with one logical purpose, OR
- Multiple files but ONE logical fix (e.g., a fix that touches a component and its test)

A "small commit" is NOT:
- Three unrelated fixes bundled together
- A "while I'm in here, let me also..." kind of commit
- A massive refactor

**Rule of thumb:** If you can't describe the commit in one sentence without using "and", it's too big. Split it.

---

## Rollback Procedures

### Scenario 1: TypeScript Error After Edit

**Symptom:** `npx tsc --noEmit` shows errors after your edit
**Action:**
1. Read the error - it tells you exactly what's wrong
2. If you can fix it in 1-2 lines, do that
3. If you can't, revert: use the Edit tool to restore the original
4. Re-run Step 1

### Scenario 2: Tests Fail After Edit

**Symptom:** A test that was passing is now failing
**Action:**
1. Read the test failure - what assertion failed?
2. Decide: did your change break the test, or did you discover a pre-existing bug the test caught?
3. If your change broke it: fix or revert
4. If pre-existing bug: document it as a finding, don't push

### Scenario 3: Build Fails

**Symptom:** `npm run build` errors out
**Action:**
1. Read the build output (it's verbose but informative)
2. Common causes: missing import, dynamic require, runtime ref at build time
3. Fix or revert

### Scenario 4: Visual Regression on Local

**Symptom:** Page looks broken or unexpected after change
**Action:**
1. Take a screenshot for reference
2. Hard-refresh the browser (Cmd+Shift+R)
3. Check the actual file - did the edit go where you expected?
4. If broken: revert via `git checkout HEAD~1 -- path/to/file` (if uncommitted) OR Edit tool to restore
5. Re-run safety stack from Step 1

### Scenario 5: Preview Deploy Broken

**Symptom:** Vercel preview shows error or broken page
**Action:**
1. **Don't merge to main.**
2. Check Vercel build logs - what failed?
3. Fix on the branch
4. Push the fix
5. Wait for new preview, re-test

### Scenario 6: Production Broken After Merge

**Symptom:** You merged to main and now production is broken
**Action:**
1. **Don't panic.** Go to Vercel dashboard.
2. **Option A (fastest):** In Vercel dashboard → Deployments → Find the last green deploy → "Promote to Production"
3. **Option B (cleaner):** `git revert <bad-sha>` and push (creates a new commit that undoes the bad one)
4. After rolling back, diagnose the issue locally
5. Fix it properly
6. Re-deploy

**Never use `git reset --hard` to fix a production issue.** That rewrites history and can cause data loss. Always use `git revert` (creates a new commit).

### Scenario 7: Catastrophic - Vercel Build Loop

**Symptom:** Every push to main breaks the build, but rollback also breaks
**Action:**
1. Vercel dashboard → Deployments
2. Find the most recent deploy that says "Ready" (green)
3. Click → "Promote to Production"
4. Production is now stable
5. Diagnose locally without pushing
6. Once you have a verified fix, push it

---

## Emergency Commands Cheat Sheet

| Need | Command |
|------|---------|
| See current state | `git status` |
| See last 5 commits | `git log --oneline -5` |
| Discard uncommitted changes to a file | `git checkout HEAD -- path/to/file` |
| Discard ALL uncommitted changes (use carefully!) | `git checkout HEAD .` (only if you've confirmed the work is lost or saved elsewhere) |
| Revert a committed change (creates new commit) | `git revert <sha>` |
| See what a commit changed | `git show <sha>` |
| Find when a line was changed | `git blame -L <line>,<line> path/to/file` |
| Run all checks at once | `npx tsc --noEmit && npx vitest run && npm run build` |
| Vercel: rollback production | Vercel dashboard → Deployments → previous green deploy → Promote to Production |
| Vercel: see deployment logs | Vercel dashboard → Deployments → click deploy → View Function Logs |

---

## What NOT To Do

| Don't | Why |
|-------|-----|
| Skip the safety stack "just this once" | This is how production gets broken |
| `git reset --hard` on shared branches | Rewrites history, can cause data loss for collaborators |
| `git push --force` to main | Overwrites history. If you need to undo, use `git revert` |
| `git commit --no-verify` | Bypasses pre-commit hooks that exist for a reason |
| `git add .` or `git add -A` without reviewing | Can accidentally commit `.env`, `test-results/`, secrets |
| Bundle 3 unrelated fixes in one commit | Makes rollback impossible without losing other work |
| Deploy to production without preview testing | Production users see your bugs first |
| Trust that "it'll be fine" | Verify always |

---

## Pre-Commit Checklist (Mental Model)

Before every commit, ask yourself:

1. Did I run `tsc --noEmit`? Was it clean?
2. Did I run `vitest run`? All tests pass? Count >= baseline?
3. Did I `npm run build`? Did it succeed?
4. Did I visually verify the change in light mode?
5. Did I visually verify the change in dark mode?
6. Did I check the browser console for errors?
7. Is this commit ONE logical change, or did I bundle?
8. Is the commit message descriptive?
9. Am I committing only the files I intended (no `.env`, no `test-results/`)?
10. Have I read the diff one last time?

If you answered NO to any of these, slow down and address it before committing.

---

## How This Process Evolves

If during execution we find a step is too slow, too lax, or missing something, we update this document. The process should evolve with the project.

After each phase, in the user review checkpoint, ask: "Did the safety stack catch issues we'd have missed otherwise? Should we add anything?"

Lessons learned go into `07-checkpoint-sop.md` Section J.
