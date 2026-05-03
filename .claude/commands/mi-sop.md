---
name: mi-sop
description: Meeting Intelligence SOP guidance and enforcement. Detects the type of work being done (code change, env var, schema change, n8n, deployment, incident) and provides the relevant checklist from migration/sop.md. Use when unsure about procedure, doing something for the first time, or when /mi-session-init shows warnings. Trigger on "SOP", "procedure", "how do I", "what's the process", "am I forgetting anything", "checklist".
---

# SOP Guidance

This skill surfaces the relevant section of `migration/sop.md` based on what you're doing.

## Usage

**No arguments:** Detect context from git state and recent changes.
**With topic:** Show specific checklist.

## Topic Map

| Argument | SOP Section | Related Skills |
|----------|-------------|----------------|
| `daily` or `workflow` | A: Daily Development | `/mi-session-init`, `/mi-promote` |
| `env` or `env-var` | B: Environment Config | `/mi-env-check` |
| `schema` or `db` or `database` | C: Database Schema | — |
| `n8n` or `pipeline` | D: n8n Pipeline | — |
| `model` or `llm` | E: LLM Configuration | — |
| `seed` or `data` | F: Data Management | `/mi-seed-dev` |
| `incident` or `down` or `emergency` | G: Incident Response + emergency-rollback.md | `/mi-rollback` |
| `test` or `testing` | H: Testing Protocol | — |
| `onboard` or `setup` | I: Onboarding | `/mi-env-check` |
| `promote` or `deploy` | A.4: Promotion | `/mi-promote` |

## Contextual Detection (no arguments)

If no topic provided, infer from context:

1. Read current git branch:
   - Branch `cr-*` → show A.2 (making changes) + relevant CR from `migration/change-requests.json`
   - Branch `main` with unpromoted commits → show A.4 (promotion checklist)
   - Branch `main`, clean → show A.1 (session start)

2. Check for risky patterns in recent work:
   - Modified `.env.local` → warn about B.1 (did you update .env.example and both Vercels?)
   - Modified `src/types/` → remind about C (schema docs)
   - Modified API routes → remind about H.4 (pre-promotion tests)

## Warning Triggers

Surface warnings when you detect:
- User modifying an API route without mentioning tests → "SOP H.4: Run npm test before promoting"
- User adding an env var → "SOP B.1: Remember to add to .env.example AND both Vercel projects"
- User mentioning schema change → "SOP C: Apply to BOTH Supabase projects (dev + prod)"
- User mentioning n8n → "SOP D.4: Always deactivate dev n8n workflows after testing"
- User about to promote → "SOP A.4: Full checklist — tests, build, verify on dev, then push"

## How to Read the SOP

Read `migration/sop.md` and extract the relevant section. Present it as a checklist the user can follow. Cross-reference with `migration/emergency-rollback.md` for incident scenarios.
