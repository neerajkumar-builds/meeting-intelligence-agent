# Continuation Prompt

Copy everything between the --- lines and paste at the start of a new Claude Code session:

---

I'm continuing work on the Meeting Intelligence Dashboard. This is a Next.js 16 sales meeting scoring platform with a dev/prod environment split completed on 2026-05-03.

Before doing anything, load full context from these sources:

1. Read CLAUDE.md — project identity, environments, mandatory rules, available skills
2. Read migration/session-handover.md — detailed record of last session (2026-05-03)
3. Read migration/knowledge-graph.yaml — component dependency map (8 features, CR impact chains)
4. Read migration/change-requests.json — all 9 CRs with details, files to modify, verification criteria
5. Read migration/sop.md — procedures for env vars, schema changes, n8n, testing, promotion
6. Read docs/progress.md — full project history and session logs
7. Query project_tracker table in dev Supabase (burcfsxsxgabknmodsrd) for live CR status:
   SELECT type, reference_id, status, title FROM project_tracker ORDER BY created_at DESC;

Key facts:
- Production: dashboard-jet-seven-93.vercel.app → Supabase cxrjlmquzhfueqrudiuy
- Development: localhost:3003 → Supabase burcfsxsxgabknmodsrd (different auth password)
- Git remotes: origin (personal/dev), production (company/prod) — both at SHA 80fafbf
- 10 skills available: /mi-session-init, /mi-env-check, /mi-cr-start, /mi-cr-complete, /mi-promote, /mi-checkpoint, /mi-rollback, /mi-seed-dev, /mi-sop, /mi-env-check
- 9 CRs pending, none started. First: CR-004 (Remove internal meetings, Critical)

Uncommitted files from prior session (NOT mine, review before starting):
- src/components/companies/intelligence-sidebar/meddic-section.tsx (radar chart)
- src/components/scorecard/competitor-mentions.tsx (bar chart)

Open items:
- .migration/env-production file not yet created (needs prod service_role key)
- #meeting-intel-dev Slack channel not created
- Vercel GitHub App not installed on neerajkumar-builds (using CLI deploy)

After loading all context, tell me:
1. Current state of both environments
2. CR status (all should be pending)
3. Any warnings from environment check
4. Recommended next action

Do NOT make any code changes until context is loaded and confirmed with me. For any CR, always show an impact brief (affected pages, components, hooks, API routes, tables, corner cases) before touching code. Use /mi-cr-start to begin.

---
