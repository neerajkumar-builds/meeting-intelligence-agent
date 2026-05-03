# Meeting Intelligence: Migration & Change Requests

## Status

| Phase | Status | Date |
|-------|--------|------|
| Step 0: Skills + CR data | Done | 2026-05-03 |
| Checkpoint 0: Pre-migration snapshot | Done | 2026-05-03 |
| Step 1: Company GitHub repo | Done | 2026-05-03 |
| Step 2: Company Vercel deployment | Done | 2026-05-03 |
| Step 3: Dev Supabase project | Done | 2026-05-03 |
| Step 4: Dev n8n workflows (dormant) | Done | 2026-05-03 |
| Step 5: Switch dev environment | Done | 2026-05-03 |
| Step 6: Promotion workflow verified | Pending | Will be tested with first CR promotion |
| Step 7: Documentation finalized | Mostly Done | 2026-05-03 (SOP, runbooks, knowledge graph, tracker — replication guide update pending) |

## Change Request Progress

| Order | CR | Title | Priority | Status |
|-------|-----|-------|----------|--------|
| 1 | CR-004 | Remove internal meetings | Critical | Pending |
| 2 | CR-005 | Score reason summaries | High | Pending |
| 3 | CR-009 | Meeting detail refinement | High | Pending |
| 4 | CR-006 | Watch recording | Medium | Pending |
| 5 | CR-002 | Summarized strengths on rep page | High | Pending |
| 6 | CR-003 | Date range filter on rep page | Medium | Pending |
| 7 | CR-007 | Company Intel panel enhancements | Medium | Pending |
| 8 | CR-008 | MEDDIC/BANT customization | Medium | Pending |
| 9 | CR-001 | Section segmentation (Sales/CSM) | Critical | Pending |

## File Map

```
migration/
├── README.md                  <-- You are here (status tracker)
├── plan.md                    <-- Full plan of action
├── change-requests.json       <-- All 9 CRs in parseable format
├── environments.md            <-- Dev/prod URLs, project IDs, env vars
├── promotion-runbook.md       <-- How to promote dev -> prod
├── changelog-revision-1.md    <-- What changed per CR (filled as CRs complete)
└── checkpoints/
    └── 0-pre-migration.md     <-- Baseline state before any changes

.migration/                    (gitignored — local operational data)
├── checkpoints.log            <-- Append-only checkpoint log
├── promotions.log             <-- Append-only promotion log
├── env-backup-pre-migration   <-- .env.local snapshot from before migration
└── env-production             <-- Production Supabase creds (for /mi-seed-dev)
```

## Quick Links

- **Full plan:** [plan.md](plan.md)
- **Environments:** [environments.md](environments.md)
- **Promotion runbook:** [promotion-runbook.md](promotion-runbook.md)
- **Skills:** `dashboard/.claude/commands/mi-*.md` (8 slash commands)
- **Project docs:** `dashboard/docs/` (13 existing documentation files)
