# Change Log — Revision 1

## CR-004: Remove internal meetings from analysis and scorecard
- **Date completed:** 2026-05-04
- **Priority:** Critical (Compliance)
- **Submitted by:** Luke
- **Files modified:** use-meetings-list.ts, use-company-meetings.ts, intelligence/route.ts, coaching/route.ts, meetings/page.tsx, coaching.test.ts, intelligence.test.ts
- **How to verify:** Scorecard KPIs exclude internal meetings. Meeting feed hides internal by default. Select "Internal" from Stage dropdown to view them. Company and rep pages exclude internal from aggregations.
- **Rollback:** `git revert 43708db`
