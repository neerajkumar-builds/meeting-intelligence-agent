# 03 - Execution Plan

**Baseline commit:** `1dc637f` (2026-04-07)
**Total fixes planned:** 21 (from `02-checkpoint-findings.md`)
**Approach:** Phased, lowest-risk first, with pause points for user review
**Last updated:** 2026-04-07

## Core Principles

1. **Tests before fixes.** We can't safely change code that has no tests. Phase 1 closes the test gap before any other changes.
2. **Cosmetic before logic.** Visual/theme changes can't crash the app. Do those before touching behavior.
3. **Logic before security.** Logic fixes are reversible. Security infrastructure (auth, headers) is the riskiest because it can lock you out.
4. **One change at a time.** Each fix is its own commit. Each commit gets the full safety stack treatment.
5. **Pause after each phase.** User reviews progress before continuing to the next phase.
6. **Discovery > deletion.** If we discover a pre-existing bug while writing tests, document it - don't silently fix it.

## Phase 0 - Already Done (Pending Commit)

These are NOT part of the audit but exist in the working tree as of `1dc637f`:

| File | What it is | Status |
|------|------------|--------|
| `src/components/scorecard/competitor-mentions.tsx` | Vendor mentions horizontal bar chart with theme + color gradient fixes | Done, tested locally, awaiting commit |
| `src/components/companies/intelligence-sidebar/meddic-section.tsx` | MEDDIC coverage radar chart with theme fixes | Done, tested locally, awaiting commit |

**Action:** Review these changes and commit them as `feat: vendor mentions chart + MEDDIC radar (Phase 0)` BEFORE starting Phase 1. This gives Phase 1 a clean baseline.

**Verification before commit:**
1. `npx tsc --noEmit` - 0 errors
2. `npx vitest run` - 77/77 tests pass
3. Visual check in light + dark mode
4. `git diff` review

---

## Phase 1 - Test Coverage (ZERO RISK)

**Goal:** Add tests for the 7 untested API routes so we have a safety net before any other changes.
**Risk:** Zero. Tests are pure additions - they observe behavior, they don't change it.
**Definition of done:**
- All 7 routes have test files in `src/__tests__/`
- All new tests pass
- All existing 77 tests still pass
- Total test count: 90+
- TypeScript clean
- Build succeeds

### Routes to test (in order)

| Order | Route | Why this order |
|-------|-------|----------------|
| 1 | `/api/reps/[name]/coaching` | New, simple, READ-only - good warm-up |
| 2 | `/api/reps/[name]/internal-insights` | New, similar pattern to coaching |
| 3 | `/api/meetings/[id]/notes` | GET + POST, slightly more complex |
| 4 | `/api/actions/meeting-prep` | LLM-dependent, needs mocking |
| 5 | `/api/actions/resummarize` | LLM-dependent, similar to meeting-prep |
| 6 | `/api/analytics/chat` | Fire-and-forget, test the silent failure path |
| 7 | `/api/slack/channels` | External API call, needs mocking |

### Test patterns to follow

Use the same patterns as existing tests in `src/__tests__/`:
- Mock Supabase client
- Mock external API calls (Anthropic, Gemini, Slack)
- Test happy path + error cases
- Test missing/invalid input
- Test edge cases (empty arrays, null fields)

### Approach for each route

For each route:
1. Read the route file to understand current behavior
2. Read an existing similar test for the pattern
3. Write the test capturing CURRENT behavior (not desired behavior)
4. Run the test - it should pass (because we're capturing current behavior)
5. If it fails, document why - that's a bug we discovered
6. Commit: `test: add coverage for /api/reps/[name]/coaching`

### Discovery rules

If a test reveals a pre-existing bug:
- Document it as a new finding in `02-checkpoint-findings.md`
- Tag it `[discovered in Phase 1]`
- DO NOT fix it in Phase 1
- Fix it in Phase 2 or Phase 3 based on severity
- The test should still pass by capturing the buggy behavior, with a `// TODO: F##` comment

### User review checkpoint

After Phase 1 complete, present:
- Total tests added (target: 13+)
- New total test count (target: 90+)
- Any pre-existing bugs discovered
- Confirmation that all existing tests still pass

User decides: continue to Phase 2 or pause.

---

## Phase 2 - Cosmetic Fixes (LOW RISK)

**Goal:** Fix visual, theme, and minor UX issues that don't change application logic.
**Risk:** Low. Worst case is a visual regression that's easy to revert.
**Definition of done:**
- All 6 fixes deployed
- Visual diff confirmed in light + dark mode
- No regression in existing tests
- TypeScript clean
- All test count baseline maintained or grown

### Fixes (in order)

| Order | Finding | Title | Effort |
|-------|---------|-------|--------|
| 1 | F14 | Health page checking dot - add dark variant | 1 line change |
| 2 | F12 | Score badge null state - use semantic classes | 1-2 lines |
| 3 | F18 | Recording banner duration text - text-[9px] -> text-xs | 1 line |
| 4 | F11 | Hardcoded hex colors - extract to CSS variables (incremental) | Multiple files |
| 5 | F16 | Aria-labels on icon buttons | Multiple files, simple additions |
| 6 | F13 | Empty state messaging consistency | Multiple files, requires audit first |

### Per-fix verification

Each fix gets the full 8-step safety stack from `04-safety-process.md`. No exceptions.

### Approach for F11 (the big one)

F11 (hardcoded hex colors) is the largest in scope. Approach:
1. **Don't fix all at once.** Pick the most-touched file first.
2. Add CSS variables to `globals.css` for the brand colors used most often
3. Replace hardcoded hex with `hsl(var(--color-X))` in ONE file at a time
4. Commit each file separately
5. Visual diff after each commit

### User review checkpoint

After Phase 2 complete, present:
- All 6 fixes deployed
- Screenshots before/after for visual fixes
- Confirmation no regressions

User decides: continue to Phase 3 or pause.

---

## Phase 3 - Logic Improvements (MEDIUM RISK)

**Goal:** Fix bugs and improve behavior that doesn't touch security infrastructure.
**Risk:** Medium. We're changing behavior, but tests from Phase 1 protect us.
**Definition of done:**
- All 8 fixes deployed
- All tests still pass (including Phase 1 additions)
- TypeScript clean
- Manual smoke test on each affected feature

### Fixes (in order)

| Order | Finding | Title | Risk |
|-------|---------|-------|------|
| 1 | F03 | Gemini API key in URL → header | Low |
| 2 | F04 | Slack URL validation | Low |
| 3 | F08 | Print page theme fix | Low |
| 4 | F17 | Reps page useMemo split | Low |
| 5 | F09 | Reps sorting null handling | Medium |
| 6 | F19 | Rate limit feedback (show remaining quota) | Medium |
| 7 | F20 | Competitor section truncation indicator | Low |
| 8 | F21 | Debouncing on sort/filter controls | Low |

### Approach for each fix

Same per-change safety stack. Plus:
- For F09 (reps sorting): Test with a rep that has no scored meetings to verify the new behavior
- For F19 (rate limit feedback): Verify the count query isn't expensive (use `head: true` count)
- For F03 (Gemini key): Test that embeddings still work after moving to header

### User review checkpoint

After Phase 3 complete, present:
- All 8 fixes deployed
- Test count growth
- Any test failures discovered (and fixed)
- Production deploy confirmation

User decides: continue to Phase 4 or pause.

---

## Phase 4 - Security Infrastructure (HIGHEST RISK)

**Goal:** Add the foundation for production-grade security: input validation, headers, and API authentication.
**Risk:** Highest. API auth done wrong can lock you out. Security headers can break embeds.
**Definition of done:**
- All 5 fixes deployed
- Tested aggressively on preview deploy BEFORE merging
- Auth works for the user, doesn't break any flow
- All previous tests pass
- TypeScript clean

### Fixes (in order - this order is critical)

| Order | Finding | Title | Risk | Why this order |
|-------|---------|-------|------|----------------|
| 1 | F06 | Input validation with Zod (start permissive) | Medium | Build validation foundation first |
| 2 | F02 | Security headers in next.config.ts | Medium | Headers are easier to revert |
| 3 | F07 | Document rate limit fail-open in code comments | Low | No behavior change, just docs |
| 4 | F10 | Add missing loading states | Low | Setup for auth-related loading |
| 5 | F01 | API authentication (start with ONE route) | High | The big one - last because riskiest |

### Approach for F01 (API auth) - SPECIAL HANDLING

This is the riskiest change in the entire audit. Strategy:

**Step 1:** Add an environment variable `SKIP_API_AUTH` (default: false). If set to `true`, skip auth entirely. This is the panic button.

**Step 2:** Add auth middleware as a helper function (not yet applied to any route).

**Step 3:** Apply auth to ONE route first: `/api/analytics/chat`.
- This is fire-and-forget, so failures don't break user flows
- Test in preview deploy
- Verify legitimate calls work
- Verify unauthenticated calls return 401
- Wait 24 hours, monitor

**Step 4:** Apply to read-only routes one by one:
- `/api/reps/[name]/coaching`
- `/api/reps/[name]/internal-insights`
- `/api/companies/[name]/intelligence`

**Step 5:** Apply to write/action routes:
- `/api/meetings/[id]/notes`
- `/api/actions/draft-email`
- `/api/actions/meeting-prep`
- `/api/actions/resummarize`
- `/api/notifications/slack`

**Step 6:** Apply to LLM/expensive routes LAST:
- `/api/chat`

**Step 7:** After all routes have auth, remove the `SKIP_API_AUTH` panic button.

**Rollback plan:**
- If something breaks: set `SKIP_API_AUTH=true` in Vercel env vars
- Redeploy
- Diagnose
- Fix and re-apply

### User review checkpoint

After Phase 4 complete, present:
- All 5 fixes deployed
- Auth tested via login -> API call -> logout -> API call (should fail) flow
- Confirmation panic button removed
- Updated `01-state-snapshot.md` with new baseline commit hash
- Updated `07-checkpoint-sop.md` "Lessons Learned" section

User decides: checkpoint complete, archive findings.

---

## Decisions Log

Things we explicitly decided NOT to do:

| Decision | Reason |
|----------|--------|
| Recording banner stays dark in both modes | Intentional design (like Spotify/YouTube embeds). User confirmed. |
| Pipeline funnel stays backlogged | Per V1.2 decision in `09-version-history.md`. Data doesn't support cross-stage company progression yet. |
| MEDDIC remains discovery-only | Per existing limitation in `10-corner-cases.md`. Other meeting types don't get MEDDIC analysis. |
| Don't add CSP headers in F02 | CSP can break Vercel Analytics, fonts, embeds. Add as a separate, careful phase later. |
| Don't add OAuth/SSO in this checkpoint | Out of scope - F01 just adds basic auth check, OAuth is a separate project. |
| Don't migrate to Tremor | We use Recharts. Tremor was installed but isn't actively used. Decision: leave as-is, audit dependencies separately. |

---

## Total Effort Estimate

Not given per the user's preference for not estimating time. Instead, structure of work:

| Phase | # of changes | Risk | User review needed |
|-------|--------------|------|-------------------|
| Phase 0 (commit recharts) | 1 commit | None | Quick |
| Phase 1 (tests) | 7 test files | Zero | Yes |
| Phase 2 (cosmetic) | 6 fixes | Low | Yes |
| Phase 3 (logic) | 8 fixes | Medium | Yes |
| Phase 4 (security) | 5 fixes | High | Yes (extensive) |

**Each phase ends with the user deciding to continue or pause.** No phase auto-flows into the next.

---

## What Changes If A New Finding Is Discovered

If a new issue is discovered mid-execution:
1. Document it as a new finding in `02-checkpoint-findings.md` (next available F number)
2. Tag it with category and severity
3. Add it to the appropriate phase
4. Discuss with user before fixing
5. Don't bundle the new fix with an in-progress fix

---

## What Changes If A Fix Breaks Something

If a fix causes a regression:
1. Revert immediately via `git revert` or `git checkout HEAD~1 -- file`
2. Re-run safety stack to confirm baseline restored
3. Document what broke in `02-checkpoint-findings.md`
4. Re-design the fix
5. Try again with the new approach

**Never push a broken change to production.** Always verify on preview deploy first.

---

## Verification After All Phases Complete

1. All findings in `02-checkpoint-findings.md` marked as RESOLVED or DEFERRED
2. Test count grew from 77 to 90+
3. TypeScript clean (`npx tsc --noEmit`)
4. Build succeeds (`npm run build`)
5. Production deploy is healthy
6. `01-state-snapshot.md` updated with new baseline commit
7. `09-version-history.md` updated with V1.5 entry covering this checkpoint
8. `07-checkpoint-sop.md` "Lessons Learned" updated
9. `02-checkpoint-findings.md` archived as `02-checkpoint-findings-2026-MM-DD.md`
10. Ready for next checkpoint
