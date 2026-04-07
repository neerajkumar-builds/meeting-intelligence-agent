# 07 - Quality Checkpoint Standard Operating Procedure (SOP)

**Last updated:** 2026-04-07
**Version:** 1.0 (initial SOP from first checkpoint)
**Owner:** Neeraj Kumar

## Purpose

This is the reusable playbook for running **Quality Checkpoints** on the Meeting Intelligence Dashboard. It captures everything we learned from the first checkpoint so future checkpoints are faster, more consistent, and more thorough.

**This is a living document.** After every checkpoint, append lessons learned (Section J) and update the checkpoint log (Section I). The SOP gets better over time.

---

## What Is A Quality Checkpoint?

A Quality Checkpoint is a midway pause after major development to step back and look at the entire system holistically. Unlike a security audit (narrow), a Quality Checkpoint covers **11 categories**:

| # | Category | Icon |
|---|----------|------|
| 1 | Security | 🔒 |
| 2 | Theme / Visual Consistency | 🎨 |
| 3 | Test Coverage | 🧪 |
| 4 | Code Quality | ✅ |
| 5 | Performance | 🚀 |
| 6 | Accessibility | ♿ |
| 7 | Mobile / Responsive | 📱 |
| 8 | UX / Navigation | 🧭 |
| 9 | Documentation Drift | 📚 |
| 10 | Dependencies | 📦 |
| 11 | Git Hygiene | 🔧 |

---

## A. When To Run A Quality Checkpoint

Trigger a checkpoint when ANY of these happen:

- After major feature releases (3+ commits of meaningful feature work)
- Before adding new users or roles (RBAC milestone)
- Before major refactors
- On a quarterly cadence (calendar-driven)
- When something feels "off" but no specific bug is reported
- Before any production incident retrospective
- After a long pause in development (>1 month)
- Before a major demo or stakeholder presentation

**Don't trigger a checkpoint:**
- During active feature development (it'll be a moving target)
- When Phase 4 of the previous checkpoint just completed (let things settle)
- For trivial bugs (use normal bug fix flow)

---

## B. Pre-Checkpoint Setup

Run this checklist BEFORE starting the checkpoint. If anything fails, fix it before proceeding.

### Working tree clean

```bash
git status
```

Should show "nothing to commit, working tree clean." If there are uncommitted changes:
- Either commit them (if they're real work)
- Or stash them (if they're WIP)
- Either way, start the checkpoint from a clean state

### Tests passing

```bash
npx vitest run
```

Should show all tests passing. Note the count - this is your "baseline" for the checkpoint.

### TypeScript clean

```bash
npx tsc --noEmit
```

Should show no errors.

### Build succeeds

```bash
npm run build
```

Should complete successfully.

### Production deploy is healthy

- Open https://dashboard-chi-blue-6ybimqrfjv.vercel.app
- Verify it loads
- Click through 2-3 key pages
- No errors in browser console

### Note the baseline

Record these somewhere (top of your checkpoint findings doc):

```
Baseline commit: <hash> (<date>)
Baseline test count: <number>
Baseline production URL: <vercel url>
```

---

## C. Discovery Phase

Read everything before changing anything.

### Required reading (in order)

1. `docs/00-README.md` - project overview
2. `docs/10-corner-cases.md` - production safety rules
3. `docs/audit-baseline/01-state-snapshot.md` - what's changed since last checkpoint
4. `docs/09-version-history.md` - the chronological story (last few entries)

### Required state checks

```bash
# What commits since last snapshot?
git log --oneline <last-snapshot-commit>..HEAD

# Any new dependencies?
git diff <last-snapshot-commit> -- package.json

# Any infrastructure changes?
git diff <last-snapshot-commit> -- next.config.ts .env.example middleware.ts

# Test count drift
npx vitest run | grep -E "Test Files|Tests"
```

### Document what you find

In a fresh `02-checkpoint-findings.md` (or update the existing one for an iterative checkpoint):
- Note the new baseline commit
- List the commits since last checkpoint (this is the work to audit)
- Note any new dependencies
- Note any infrastructure changes
- Note test count change

---

## D. The 11 Audit Categories

For each category, use the prescribed checks. If you find an issue, document it in the rich format from `02-checkpoint-findings.md`.

### 1. 🔒 Security

**Checks:**
- Read `src/middleware.ts` - verify auth is enforced on protected routes
- Read `next.config.ts` - verify security headers are configured
- Grep for API keys in URLs: `grep -rn "?key=" src/`
- Grep for hardcoded secrets: `grep -rn "sk-\|xoxb-\|AIza" src/` (should return zero)
- Read every POST API route - verify input validation
- Read URL-accepting routes (Slack notification) - verify URL validation
- Check rate limiting - read the chat route's rate limit logic
- Look for unsafe HTML rendering patterns

**Tools:** Read tool, Grep tool, manual code review.

**What counts as a finding:**
- Missing auth on a route that exposes data
- Missing input validation on a POST route
- Secrets in URL query strings
- Headers missing
- Validation that fails open without logging

### 2. 🎨 Theme / Visual Consistency

**Checks:**
- Grep for hardcoded hex colors: `grep -rn "#[0-9a-fA-F]\{3,6\}" src/components/ --include="*.tsx"`
- Grep for missing dark variants: look for `bg-gray-*`, `text-gray-*` without `dark:`
- For Recharts components: verify `tick` prop uses `fill`, NOT `stroke` (we learned this!)
- Visual diff: open every page in light AND dark mode

**Tools:** Grep, browser visual check.

**What counts as a finding:**
- Hex colors that should be CSS variables
- Missing `dark:` variants on background/text colors
- Charts with axis labels invisible in one mode
- Components that look broken in light or dark mode

### 3. 🧪 Test Coverage

**Checks:**
- Count actual API routes: `find src/app/api -name "route.ts" | wc -l`
- Count test files: `find src/__tests__ -name "*.test.*" | wc -l`
- For each route, check if a corresponding test file exists
- Run `npx vitest run` and note total tests + files

**Tools:** Bash, manual review.

**What counts as a finding:**
- A new route added in the last batch of commits without tests
- Routes with critical logic but no tests
- Test count flat while code grew significantly

### 4. ✅ Code Quality

**Checks:**
- `npx tsc --noEmit` - any errors?
- `npm run lint` - any warnings?
- Look for unused imports: `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`
- Look for very long files (>500 lines): `find src -name "*.tsx" -size +20k`
- Look for duplicated code patterns

**Tools:** Bash, Read.

**What counts as a finding:**
- TypeScript errors (should be zero)
- ESLint errors or warnings beyond a small baseline
- Files >800 lines (suggest refactor)
- Same logic copy-pasted in 3+ places

### 5. 🚀 Performance

**Checks:**
- Look for `useMemo` dependencies that re-trigger on every state change
- Look for unbatched state updates
- Look for large bundle imports (e.g., importing entire libraries)
- Check Supabase queries for missing indexes (in n8n-owned tables, this is a flag, not a fix)

**Tools:** Read, manual code review.

**What counts as a finding:**
- Expensive computation triggered too often
- N+1 query patterns
- Unused dependencies in package.json bloating the bundle

### 6. ♿ Accessibility

**Checks:**
- Grep for icon-only buttons: look for `<button>` with only an icon child and no `aria-label`
- Verify keyboard navigation works (Tab through the page)
- Check color contrast on key elements (use browser DevTools)
- Verify focus indicators are visible

**Tools:** Browser DevTools, manual review.

**What counts as a finding:**
- Icon buttons without aria-label
- Links/buttons that aren't keyboard-reachable
- Low contrast text on certain backgrounds
- Missing focus indicators

### 7. 📱 Mobile / Responsive

**Checks:**
- Open every page at 375px width (iPhone SE)
- Open every page at 768px (iPad portrait)
- Open every page at 1024px (iPad landscape)
- Check for fixed widths, sidebar overflow, chart sizing issues
- Check touch target sizes (should be at least 44x44px)

**Tools:** Browser DevTools mobile emulation.

**What counts as a finding:**
- Page broken at any tested viewport
- Charts too small to read
- Sidebar overlapping content
- Touch targets too small

### 8. 🧭 UX / Navigation

**Checks:**
- Loading states present everywhere data is fetched?
- Empty states helpful (not just "No data")?
- Error states show recovery actions?
- Back buttons work?
- Filter clearing works?
- Modal escape (Esc key) works?
- Form validation messages clear?

**Tools:** Manual click-through.

**What counts as a finding:**
- Missing loading state causing layout shift
- Empty state without context
- Error state without recovery action
- Broken back button or navigation

### 9. 📚 Documentation Drift

**Checks:**
- Compare `.env.example` to actual env vars used in code
- Compare `docs/06-api-reference.md` to actual routes in `src/app/api/`
- Check `docs/09-version-history.md` is current with `git log`
- Check `docs/00-README.md` numbers (route count, test count, etc.) are still accurate
- Check `ARCHITECTURE.md` route table is current

**Tools:** Read, Bash.

**What counts as a finding:**
- env vars used in code but not in .env.example
- API routes that exist but aren't in the API reference
- Version history that's behind git log
- Stat counts that are stale

### 10. 📦 Dependencies

**Checks:**
- `npm outdated` - what's behind?
- `npm audit` - any vulnerabilities?
- Find unused packages: cross-reference `package.json` with actual imports
- Find missing packages: imports without corresponding entries in `package.json`

**Tools:** Bash.

**What counts as a finding:**
- Critical/high vulnerabilities in `npm audit`
- Major version updates available for key dependencies
- Unused packages bloating the install
- Imports of packages not in package.json

### 11. 🔧 Git Hygiene

**Checks:**
- `git status` - any uncommitted changes?
- `git status --short` - any untracked files?
- Should those untracked files be in `.gitignore`?
- `git branch -a` - any stale branches?
- `git log origin/main..HEAD` - any unpushed commits?

**Tools:** Bash.

**What counts as a finding:**
- Uncommitted changes that aren't WIP
- Untracked files that should be in `.gitignore`
- Stale feature branches that should be deleted
- Unpushed commits that should be pushed

---

## E. Triage Rules

After collecting findings, triage by severity:

| Severity | Definition | Examples |
|----------|-----------|----------|
| **Critical** | Security vulnerabilities, data corruption, crashes affecting all users | No API auth, secrets in URL, unrestricted external URL acceptance |
| **High** | Broken UX for common flows, test gaps in critical paths, blocking issues | Untested API routes, missing input validation, sorting bugs |
| **Medium** | Theme/polish issues, inconsistencies, single-flow bugs | Hardcoded colors, missing dark variants, minor a11y issues |
| **Low** | Cosmetic, nice-to-have, edge cases | Tiny text, missing debouncing, minor polish |

**Don't inflate severity.** A genuine Critical is rare. Most findings are Medium or Low.

---

## F. Execution Phases

Once findings are triaged, plan the fixes in 4 phases:

### Phase 1: Test Coverage (zero risk)
Add tests for any untested critical paths. Tests are pure additions - they observe behavior, they don't change it. This phase BLOCKS the others - we need the safety net first.

### Phase 2: Cosmetic Fixes (low risk)
Visual, theme, and minor UX issues. Easy to verify, easy to revert.

### Phase 3: Logic Improvements (medium risk)
Bug fixes and behavioral improvements. Tests from Phase 1 protect us.

### Phase 4: Security Infrastructure (highest risk)
Auth, headers, validation. Test aggressively on preview before merging. This is the riskiest phase because security changes can lock you out or break embeds.

**Pause after every phase for user review.** No phase auto-flows into the next.

See `03-execution-plan.md` for the full phase definitions.

---

## G. Per-Change Verification Stack

For every single change, run the 8-step safety stack from `04-safety-process.md`. No exceptions.

```
1. npx tsc --noEmit       (TypeScript clean)
2. npx vitest run         (tests pass, count >= baseline)
3. npm run build          (build succeeds)
4. Local visual check     (light + dark mode)
5. git commit             (small, focused, descriptive)
6. git push to branch     (Vercel auto-creates preview)
7. Smoke test on preview  (production-like environment)
8. Merge to main          (production deploy)
```

If any step fails, fix or revert. Don't proceed past a red step.

---

## H. Post-Checkpoint Cleanup

After all phases complete:

### Update version history
Append a new version entry to `docs/09-version-history.md` covering the changes made during this checkpoint.

### Update state snapshot
Update `01-state-snapshot.md`:
- New baseline commit hash
- New test count
- Reset the "delta since last checkpoint" section

### Archive findings
Rename `02-checkpoint-findings.md` to `02-checkpoint-findings-YYYY-MM-DD.md` so it's preserved as a historical record. Create a fresh `02-checkpoint-findings.md` for the next checkpoint.

### Update this SOP

Append to Section I (Checkpoint Log) - one row per checkpoint.
Append to Section J (Lessons Learned) - any insights from this checkpoint.
Update Section D if any audit categories need refinement.

### Reset for next checkpoint

The audit-baseline folder is now ready for the next quality checkpoint. The SOP is more refined. The state-snapshot reflects current reality. Future Claude sessions can pick up immediately.

---

## I. Checkpoint Log (Running History)

Each checkpoint adds a row to this table.

| Date | Baseline Commit | Findings | Phase Completed | Outcome / Notes |
|------|----------------|----------|-----------------|-----------------|
| 2026-04-07 | `1dc637f` | 21 (4C/6H/6M/5L) | Planning only - SOP created | First holistic checkpoint. Created baseline docs and SOP. Phases not yet executed. |
| (next) | ... | ... | ... | ... |

---

## J. Lessons Learned (Updated Each Checkpoint)

Append insights here after every checkpoint. Future sessions read this section to avoid repeating mistakes.

### From Checkpoint 1 (2026-04-07)

**Discovery & Planning:**
- ALWAYS check `git log` first to understand the chronological context of the work being audited. Commit messages are essentially the dev log - use them.
- ALWAYS check existing `docs/` folder before planning to create new documentation. The Meeting Intel project had 13 comprehensive docs (250KB) that I almost duplicated.
- Use `git log --pretty=format:'%h | %ad | %s' --date=short <base>..HEAD` for quick commit history.
- Use full commit messages (`%n=== %h ===%n%s%n%n%b`) to see the WHY behind each commit.

**Audit findings:**
- Filter out false positives. Two notable ones: Supabase `.eq()` is NOT SQL injection (parameterized queries), and `.env.local` is local-only (Next.js convention).
- Group findings by CATEGORY first, then severity. Easier to scan when fixing.
- Reference commit hashes for "introduced in" - lets us trace bugs to their origin.

**Execution:**
- Tests BEFORE fixes is non-negotiable. We can't safely change code that has no tests.
- Cosmetic fixes BEFORE logic fixes. Cosmetic can't crash the app.
- Logic BEFORE security infrastructure. Security changes are riskiest.
- API auth must be added to ONE route first, with a SKIP_AUTH panic button env var.

**Theme / Recharts learnings:**
- In Recharts, axis text uses `fill`, not `stroke`. Setting `stroke` on axis text adds an outline which makes labels look broken. Use `tick={{ fill: ... }}` instead.
- Recharts `Cell` component allows per-bar fill - useful for click-to-highlight patterns.
- Don't pass CSS variables in SVG attributes via Tailwind `dark:` - SVG doesn't process CSS variables the same way. Use explicit colors or `currentColor`.

**Documentation:**
- The first SOP section to write is "When to run a checkpoint" because it gates everything else.
- Resumption prompts must be EXACT - paraphrasing loses guardrails.
- Cross-link aggressively. Findings should reference the safety process. Execution plan should reference findings. SOP should reference the execution plan.

**Process:**
- 8-step safety stack catches almost everything BEFORE it gets to production.
- "One commit = one logical fix" prevents bundle blowups.
- Pause points after each phase prevent scope creep.

### From Checkpoint 2 (TBD)

(Future)

---

## K. SOP Maintenance

This SOP itself should be maintained:

- **Update Section D** if you discover an audit category not covered
- **Update Section E** if triage rules need refinement
- **Update Section F** if execution phasing changes
- **Update Section J** after every checkpoint
- **Update Section I** after every checkpoint with the run details

The SOP is a tool to make us better, not a static rulebook. Improve it freely.

---

## Quick Reference Card

**Start of every checkpoint:**
1. Pre-checkpoint setup (Section B) - clean tree, green tests, clean TS, build OK, deploy OK
2. Discovery phase (Section C) - read everything, run state checks
3. Audit by category (Section D) - 11 categories, document findings
4. Triage (Section E) - sort by severity
5. Plan phases (Section F) - tests, cosmetic, logic, security
6. Execute with safety stack (Section G) - 8 steps per change
7. Post-cleanup (Section H) - update docs, archive findings
8. Update this SOP (Sections I and J)

**Always:**
- Read before changing
- Test before fixing
- One change per commit
- Pause after every phase
- Update docs as you go
