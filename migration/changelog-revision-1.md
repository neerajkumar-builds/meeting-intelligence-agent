# Change Log — Revision 1

## CR-004: Remove internal meetings from analysis and scorecard
- **Date completed:** 2026-05-04
- **Priority:** Critical (Compliance)
- **Submitted by:** Luke
- **Files modified:** use-meetings-list.ts, use-company-meetings.ts, intelligence/route.ts, coaching/route.ts, meetings/page.tsx, coaching.test.ts, intelligence.test.ts
- **How to verify:** Scorecard KPIs exclude internal meetings. Meeting feed hides internal by default. Select "Internal" from Stage dropdown to view them. Company and rep pages exclude internal from aggregations.
- **Rollback:** `git revert 43708db`

## CR-005: Score reason summaries
- **Date completed:** 2026-05-04
- **Priority:** High
- **Submitted by:** Stephen
- **Files modified:** score-section.tsx
- **How to verify:** Open any meeting detail page. Below the score gauges, reasoning text explains each score. Discovery shows Meeting Outcome + ICP Fit reasons. Follow-Up shows Engagement reasoning. Long text has "Show more" toggle.
- **Rollback:** `git revert 5811302`
