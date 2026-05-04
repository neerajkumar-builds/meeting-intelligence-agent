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

## CR-009: Refinement of meeting detail page
- **Date completed:** 2026-05-04
- **Priority:** High
- **Submitted by:** Stephen
- **Files modified:** intelligence-tabs.tsx
- **How to verify:** Open a discovery meeting detail. "Next Steps" and "Reasoning" blocks are removed from Summary tab. Deal sentiment and tentative close date remain. Score reasons are now shown below gauges (CR-005).
- **Rollback:** `git revert 5a97624`

## CR-002: Summarized strengths on rep page
- **Date completed:** 2026-05-04
- **Priority:** High
- **Submitted by:** Luke
- **Files modified:** coaching-summary.tsx
- **How to verify:** Rep detail page shows top 5 strengths and top 5 improvements. Click "X insights" to see all. Secondary sections (blind spots, recommendations) behind "Show more" toggle.
- **Rollback:** `git revert 666e5b3`

## CR-003: Date range filter on rep dashboard
- **Date completed:** 2026-05-04
- **Priority:** Low
- **Submitted by:** Luke
- **Files modified:** reps/[name]/page.tsx
- **How to verify:** Rep detail page has period selector (All Time, 7d, 30d, 90d). KPIs, charts, and meeting list filter by selected date range.
- **Rollback:** `git revert 69f939b`

## CR-007: Company Intelligence Panel visibility
- **Date completed:** 2026-05-04
- **Priority:** Medium
- **Submitted by:** Stephen
- **Files modified:** intelligence-sidebar/index.tsx
- **How to verify:** Company detail page and meeting detail page show intelligence sidebar expanded by default on desktop. Users can still collapse it.
- **Rollback:** `git revert 7f2df1a`

## CR-008: Framework customization (MEDDIC/BANT/SPICED)
- **Date completed:** 2026-05-04
- **Priority:** Medium
- **Submitted by:** Stephen
- **Files modified:** constants.ts, meddic-section.tsx
- **How to verify:** Intelligence panel shows both BANT (expanded) and MEDDIC (collapsed) with radar charts. BANT has 4 dimensions, MEDDIC has 6.
- **Rollback:** `git revert 24ede0d`

## CR-006: Watch Recording (play + download)
- **Date completed:** 2026-05-04
- **Priority:** Medium
- **Submitted by:** Stephen
- **Files modified:** meetings/[id]/page.tsx
- **How to verify:** Recording banner has two options: "Watch Recording" opens Zoom web player, "Download" button downloads the file. Disclaimer: "Requires Zoom login. Some recordings may need a passcode."
- **Rollback:** `git revert ddeacd6`

## CR-001: Section-based sidebar (Sales/CS/Internal/All)
- **Date completed:** 2026-05-04
- **Priority:** Critical
- **Submitted by:** Luke & Stephen
- **Files modified:** sidebar-nav.tsx, constants.ts, section-context.tsx, providers.tsx, use-section-meetings.ts, use-company-meetings.ts, all page files
- **How to verify:** Sidebar shows collapsible sections (All, Sales, CS, Internal). Switching sections filters all data views. Page titles reflect active section. Ask Blarney prompts are section-specific. Stage dropdowns show only section-relevant types.
- **Rollback:** `git revert 874467c`

---

## Post-CR Features (2026-05-04)

### Admin Panel
- `/admin` page for user management (leadership/admin only)
- Single-step user creation (auth + role via API)
- Edit role, toggle section access, deactivate/activate users
- Admin password reset for other users
- Self-deactivation prevention, min 1 section required

### User Profile
- Initials dropdown in header (replaces logout icon)
- Edit Profile dialog: change name, self-service password change
- Forgot password on login page with email reset
- Password recovery form when clicking reset link from email

### Security
- Deactivated users blocked with loading guard (no dashboard flash)
- Per-user chat history (localStorage keyed by email)
- SUPABASE_SERVICE_ROLE_KEY for admin operations

### Brand Alignment
- Stage badges: brand-derived colors (Electric Blue, Black, Grey)
- Chart colors: Follow-Up uses brand black (was purple)
- Em dashes removed from entire codebase
