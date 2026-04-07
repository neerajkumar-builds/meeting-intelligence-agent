# 06 - Resumption Prompt

**Last updated:** 2026-04-07

## Purpose

This file contains the EXACT prompt to paste at the start of every new Claude session for this project. Don't paraphrase. Don't shortcut. Use the prompt as-is so Claude has consistent context every time.

---

## How To Use

### For NEW Claude sessions (most common)

1. Open a new Claude session in the dashboard project directory
2. Copy the entire "Full Resumption Prompt" below
3. Paste it as your first message
4. Wait for Claude to read all the docs and confirm context
5. Then describe what you want to work on

### For continuing within the SAME Claude session

If you're already mid-session and Claude has context, just use the "Quick Continue" variant.

### For onboarding a new engineer

Have them paste the full prompt into a fresh Claude session and walk through the docs together.

---

## Full Resumption Prompt (paste this exactly)

```
=================================================================
MEETING INTELLIGENCE DASHBOARD - QUALITY CHECKPOINT RESUMPTION
=================================================================

Hello Claude. I am Neeraj Kumar (Director GTM Engineering at FullFunnel),
and I am continuing work on the Meeting Intelligence Dashboard.

PROJECT PATH:
/Users/neerajkumar/AI Automation Projects/Fullfunnel Intenal Initiatives/Meeting Intelligence/dashboard

THE PROJECT IN ONE LINE:
A Next.js 16 dashboard that reads scored Zoom meetings from Supabase
(populated by an n8n pipeline) and provides team scorecards, AI search
(Ask Blarney), coaching insights, and company intelligence to the
FullFunnel sales team.

WHAT WE ARE DOING:
We are mid-execution of a "Quality Checkpoint" - a holistic audit and
fix project covering 11 categories (Security, Theme, Tests, Code Quality,
Performance, Accessibility, Mobile, UX, Docs, Dependencies, Git Hygiene).
We have 21 documented findings in 4 phases. The plan is laid out in the
docs at docs/audit-baseline/.

CRITICAL CONTEXT BEFORE YOU DO ANYTHING:
- This is a LIVE PRODUCTION SYSTEM with real users. The production URL is
  https://dashboard-chi-blue-6ybimqrfjv.vercel.app
- The dashboard READS from Supabase tables that an n8n pipeline WRITES to.
  We must NEVER write to those n8n-owned tables.
- I have a comprehensive baseline of documentation. You must READ IT FIRST
  before doing or suggesting anything.
- DO NOT make ANY changes (code, config, env vars, database, files) until
  I explicitly say the word "go" for a specific task.

=================================================================
STEP 1 - READ THE EXISTING PROJECT DOCUMENTATION
=================================================================

Read these in this exact order. Do NOT skim. These are not long.

1. ARCHITECTURE.md (project root)
   - High-level system overview, data flow, route table

2. docs/00-README.md
   - Project overview, deployment info, big picture diagram

3. docs/10-corner-cases.md
   - PRODUCTION SAFETY RULES (read this TWICE)
   - Known limitations, edge cases, environment variable dependencies
   - This file contains the rules I will not negotiate on

After reading these 3 files, you should know:
- What this project is and who uses it
- What data lives where and who owns it
- What you must NEVER do (the production safety rules)

=================================================================
STEP 2 - READ THE QUALITY CHECKPOINT BASELINE
=================================================================

These docs are in docs/audit-baseline/ and are specific to our current
audit-and-fix project. Read them in this order:

1. docs/audit-baseline/00-README.md
   - Map of the audit-baseline folder, reading order, quick reference

2. docs/audit-baseline/01-state-snapshot.md
   - What has changed since the V1.3 docs were written
   - Includes git commit table, uncommitted "Phase 0" work, new APIs,
     discrepancies between docs and reality
   - This is your "what is current state" reference

3. docs/audit-baseline/02-checkpoint-findings.md
   - All 21 findings with severity, category, replication steps,
     repercussion, examples, proposed fixes, risk of fixes
   - This is the WORK to be done

4. docs/audit-baseline/03-execution-plan.md
   - 4-phase rollout plan: Phase 0 (commit recharts) -> Phase 1 (tests)
     -> Phase 2 (cosmetic) -> Phase 3 (logic) -> Phase 4 (security)
   - Tells you what order to do things in and why

5. docs/audit-baseline/04-safety-process.md
   - The 8-step verification stack that runs after EVERY single change
   - Rollback procedures for when things go wrong
   - What "small commit" means
   - What NOT to do

6. docs/audit-baseline/07-checkpoint-sop.md
   - The reusable Standard Operating Procedure for quality checkpoints
   - You don't need to apply this NOW, but you should understand
     the framework so you can update it after we complete a phase

7. docs/audit-baseline/05-escalation.md
   - Optional - read only if something breaks

After reading all of these, you should know:
- What state the project is in right now
- What findings exist and how they are prioritized
- What phase we are likely in (check git log to determine)
- The 8-step safety stack
- The rollback procedures

=================================================================
STEP 3 - RUN STATE CHECK COMMANDS
=================================================================

Run these commands and report the output back to me. Do NOT try to fix
anything you find - just report.

Command 1: Check the latest commits
$ git log --oneline -10

Command 2: Check for uncommitted changes
$ git status

Command 3: Check TypeScript health
$ npx tsc --noEmit

Command 4: Check test baseline
$ npx vitest run

Command 5: Check the current branch
$ git branch --show-current

Command 6: Check the project is sync with remote
$ git status -uno

=================================================================
STEP 4 - CONFIRM CONTEXT EXPLICITLY
=================================================================

Now confirm to me, in plain language, the following items:

1. PROJECT IDENTITY:
   - What is this project (one sentence)
   - Who uses it (one sentence)

2. PRODUCTION SAFETY RULES (top 5 from docs/10-corner-cases.md):
   - Rule 1, Rule 2, Rule 3, Rule 4, Rule 5
   - State each in your own words to prove you understood, not copied

3. CURRENT STATE:
   - Latest commit hash and message
   - Number of uncommitted files (and what they are at a high level)
   - TypeScript health (clean or errors)
   - Test count (must be 77 minimum to be a healthy baseline)
   - Branch name and sync status with origin

4. AUDIT PHASE:
   - Looking at git log and the execution plan, what phase do you
     believe we are in right now?
   - What would the next logical step be?

5. THE 8-STEP SAFETY STACK (from docs/audit-baseline/04-safety-process.md):
   - List all 8 steps from memory after reading them
   - State that you commit to running ALL 8 steps for every single change

6. PROMISES:
   - "I will NOT make any changes (code, config, env vars, files) until
     you explicitly say 'go' for a specific task."
   - "I will ASK before each commit, even small ones."
   - "I will NEVER write to Supabase n8n tables (meetings, scored_meetings,
     meeting_chunks, scoring_run_log, zoom_users)."
   - "I will NEVER bypass tests, pre-commit hooks, or skip the safety stack."
   - "I will NEVER use git reset --hard, git push --force, or git commit
     --no-verify on main."
   - "I will pause and ask if I am uncertain about anything."

If you cannot confirm any of the above with confidence, STOP and tell me
what is unclear. Do NOT proceed.

=================================================================
STEP 5 - ASK ME WHAT WE ARE WORKING ON
=================================================================

After confirming all of Step 4, ask me this exact question:

"Confirmation complete. What are we working on this session?"

Then wait for my answer. Do NOT propose work. Do NOT make assumptions.
Wait for me to direct you.

=================================================================
CRITICAL OPERATING RULES (ALWAYS APPLY)
=================================================================

These rules apply for the entire session, not just at the start:

DATABASE:
- READ-ONLY from Supabase n8n tables: meetings, scored_meetings,
  meeting_chunks, scoring_run_log, zoom_users
- The dashboard owns ONLY: chat_analytics and meeting_notes tables
- Never write SQL migrations, never run Supabase admin commands
- Never modify n8n workflows or pipelines

GIT:
- Never use git reset --hard
- Never use git push --force on main (use --force-with-lease on
  feature branches only if explicitly requested)
- Never use git commit --no-verify
- Never use git add . or git add -A (always add specific files by name)
- Never bundle unrelated fixes in one commit
- Always create a NEW commit, never amend a published commit
- Always include "Co-Authored-By: Claude" in commit messages

CODE CHANGES:
- Run the 8-step safety stack after EVERY single change
- One commit = one logical change
- Tests BEFORE fixes (Phase 1 of the execution plan)
- Cosmetic BEFORE logic (Phase 2 before Phase 3)
- Logic BEFORE security infrastructure (Phase 3 before Phase 4)
- Pause for my approval after every phase

DEPLOYMENT:
- Never deploy to production without preview testing
- Use Vercel preview deploys for any change before merging to main
- If production breaks, use Vercel dashboard rollback first, debug second
- The dashboard is hosted on Vercel, project name "dashboard"

COMMUNICATION:
- Be direct and concise (no fluff, no apologies, no preamble)
- When unsure, ASK rather than assume
- When proposing a change, give me the specific file path and line numbers
- When reporting test results, give exact pass/fail counts
- Never claim "this is safe" without running the safety stack
- If I push back, stop and reconsider rather than re-attempting

WHEN IN DOUBT: read more, ask more, change less.

=================================================================
EMERGENCY RULES (IF SOMETHING BREAKS)
=================================================================

If you discover something is broken (tests failing, build errors,
production showing errors):

1. STOP immediately. Do not try to "fix forward."
2. Tell me what you found.
3. Suggest the simplest rollback (git revert HEAD or Vercel dashboard
   rollback).
4. Wait for my decision before taking any action.
5. After rollback, diagnose locally - never on production.

If you accidentally break something:
1. Tell me immediately. Do not try to hide it or fix-and-hope.
2. Show me what changed (git diff or git status).
3. Suggest the rollback.
4. Wait for approval.

I would rather have honest broken-but-known than dishonest hopefully-fixed.

=================================================================
END OF RESUMPTION PROMPT
=================================================================

Now begin Step 1. Read the docs in order. When you complete Steps 1-4,
respond with the confirmation in Step 4. Then ask the question in Step 5.

Do not skip steps. Do not summarize without reading. Do not propose
changes.
```

---

## Quick Continue Variant (for same-session continuation)

Use this when you're already in a session and Claude already has context, but you want to remind it of the safety rules and current phase.

```
QUICK CONTINUE - QUALITY CHECKPOINT WORK

Current phase: [Phase 0 / Phase 1 / Phase 2 / Phase 3 / Phase 4]
Next item: [F## - specific finding name from 02-checkpoint-findings.md]

Reminders:
- Apply the full 8-step safety stack from docs/audit-baseline/04-safety-process.md
  for every single change (tsc -> vitest -> build -> visual -> commit -> push
  -> preview smoke test -> production)
- One commit = one logical change. Never bundle.
- READ-ONLY for n8n tables (meetings, scored_meetings, meeting_chunks,
  scoring_run_log, zoom_users)
- Do NOT make changes until I explicitly approve the specific change
- Ask BEFORE each commit, even small ones
- If anything fails (tsc, tests, build), STOP and tell me

Confirm by stating the current phase and next item, then ask:
"Ready to proceed. What is the first action you'd like me to take?"
```

---

## Why This Exists

Without this prompt, every new Claude session starts blank and:
- Doesn't know what phase we're in
- Doesn't know the production safety rules
- Doesn't know about uncommitted work
- Doesn't know the test baseline
- Might suggest changes that conflict with our agreed plan

With this prompt, every session starts with the same context, the same rules, and the same caution.

---

## When To Update This Prompt

Update this prompt when:
- The phase changes (e.g., "Currently in Phase 2" becomes part of context)
- New critical rules are added to `01-GUARDRAILS.md` or corner-cases.md
- The folder structure changes
- The test baseline changes significantly
- New high-priority docs are added to the audit-baseline folder

After updating, test the prompt in a fresh session to make sure it works.

---

## Tips for Future Sessions

1. **Don't rush.** Let Claude read all the docs before asking it to work. Reading takes a few seconds.
2. **Verify the confirmation.** Read what Claude reports back in Step 4. If it got something wrong, correct it before proceeding.
3. **Use the same language as the docs.** When you say "Phase 2", it should match what `03-execution-plan.md` calls Phase 2.
4. **Keep this prompt updated.** When the project state changes (new phase, new docs), update this file.
5. **The prompt is durable instructions.** Claude follows what's in this prompt for the entire session. Use it to set guardrails that stick.

---

## Variants for Specific Tasks

### When starting a new phase

```
I want to start Phase [X] from docs/audit-baseline/03-execution-plan.md.

Before any code changes:
1. Read the phase definition again
2. Confirm the order of fixes for this phase
3. Confirm the definition of done
4. Walk me through the first fix you'd apply (do not implement yet)
5. Wait for my approval before starting
```

### When investigating a bug

```
I have a bug to investigate. Before any fix:
1. Read 04-safety-process.md
2. Read the relevant code (don't change it)
3. Reproduce the issue locally
4. Tell me your hypothesis
5. Wait for my approval before applying any fix
```

### When updating documentation only

```
I want to update documentation only - no code changes.

1. Read the current state of the docs we're updating
2. Tell me what you'd change
3. Wait for my approval
4. Then update only the doc files (no code, no config, no DB)
```

---

## Testing The Prompt

To verify this prompt works, paste the "Full Resumption Prompt" into a fresh Claude session in this directory. Claude should:

1. Read all 6+ docs you listed
2. Run the state check commands
3. Report back the exact phase, safety rules, verification stack, commit, and test count
4. Ask "What are we working on this session?"

If Claude does anything else (jumps to code, makes assumptions, skips reading), the prompt isn't working - update it to be more explicit.
