# Quality Checkpoint - Audit Baseline

**Last updated:** 2026-04-07
**Baseline commit:** `1dc637f`
**Status:** Phase 0 (recharts work pending commit)

## What This Folder Is

This folder contains artifacts from the **first holistic quality checkpoint** of the Meeting Intelligence Dashboard. It does NOT replace the main project documentation in `../` (the `docs/` folder).

A **Quality Checkpoint** is a midway pause after major development to look at the entire system holistically across 11 categories: Security, Theme/Visual, Test Coverage, Code Quality, Performance, Accessibility, Mobile/Responsive, UX/Navigation, Documentation Drift, Dependencies, and Git Hygiene.

This is the FIRST checkpoint. The SOP in `07-checkpoint-sop.md` is designed to make every future checkpoint faster, more consistent, and more thorough.

## What's In This Folder

| File | Purpose |
|------|---------|
| `00-README.md` | This file - the map |
| `01-state-snapshot.md` | What's changed since the V1.3 docs were written (sourced from git history) |
| `02-checkpoint-findings.md` | All ~21 findings in rich format, organized by category and severity |
| `03-execution-plan.md` | Phased rollout plan (tests -> cosmetic -> logic -> security) |
| `04-safety-process.md` | The 8-step verification stack and rollback procedures |
| `05-escalation.md` | Who to contact if something breaks |
| `06-resumption-prompt.md` | The exact prompt to paste into future Claude sessions |
| `07-checkpoint-sop.md` | **THE BIG ONE** - reusable SOP for ALL future quality checkpoints |

## Reading Order (First-Time)

If you've never seen this project before, follow this order. Total time: ~75 minutes.

| # | Doc | Time | Why |
|---|-----|------|-----|
| 1 | `../00-README.md` | 5 min | Project overview |
| 2 | `../10-corner-cases.md` | 10 min | **Production safety rules - READ TWICE** |
| 3 | `00-README.md` (this file) | 3 min | Folder map |
| 4 | `01-state-snapshot.md` | 5 min | What changed since V1.3 |
| 5 | `02-checkpoint-findings.md` | 20 min | The full audit report |
| 6 | `03-execution-plan.md` | 10 min | What we're doing about it |
| 7 | `04-safety-process.md` | 5 min | How we verify each change |
| 8 | `07-checkpoint-sop.md` | 15 min | The reusable playbook |
| 9 | `06-resumption-prompt.md` | 2 min | Bookmark for future sessions |

## Reading Order (Resumption)

If you're resuming work, just paste the prompt from `06-resumption-prompt.md` into a new Claude session. It tells Claude what to read.

## Quick Reference

- **Project:** Meeting Intelligence Dashboard
- **Tech:** Next.js 16.2.2, React 19.2.4, Supabase, Anthropic Claude, Vercel
- **Production:** https://dashboard-chi-blue-6ybimqrfjv.vercel.app
- **Active users:** 1 (Neeraj Kumar, Director GTM Engineering, FullFunnel)
- **Total tests:** 77 across 13 files (baseline that must stay green)
- **Total commits:** 36 (main branch, in sync with origin)

## How This Folder Stays Current

After every quality checkpoint:

1. `01-state-snapshot.md` is updated with the new baseline commit hash
2. `02-checkpoint-findings.md` is archived as `02-checkpoint-findings-YYYY-MM-DD.md`
3. `07-checkpoint-sop.md` "Lessons Learned" section is appended with new insights
4. The "Checkpoint Log" table at the bottom of the SOP is updated with the run

## Critical Rules (Always Apply)

These are from `../10-corner-cases.md` but worth repeating here for emphasis:

1. **Never write to Supabase n8n tables** (`meetings`, `scored_meetings`, `meeting_chunks`, `scoring_run_log`, `zoom_users`)
2. **Never bypass tests or pre-commit hooks**
3. **Never deploy directly to production without preview testing**
4. **Never bundle unrelated changes in one commit**
5. **When in doubt: read more, ask more, change less**

## Who to Contact

See `05-escalation.md` for the full contact list and emergency procedures.
