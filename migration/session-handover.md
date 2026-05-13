# Session Handover: Meeting Intelligence

## Last Session
- **Date:** 2026-05-13 (Session 2)
- **Duration:** Extended session covering Sprint 3 (notifications, CS intelligence, pipeline triggers)
- **Operator:** Neeraj + Claude Opus 4.6

## What Was Done (2026-05-13, Session 2)

### Notification System (CR-011) - deployed commits `99b9f3a`, `3b61a79`, `4d1b859`, `cee29aa`
- Digest engine at `/api/notifications/digest`: Mon priorities, Tue-Thu actions, Fri review
- 3 Slack channels: #mi-sales (C0B32H6C0SK), #mi-cs (C0B3BKT18P5), #mi-internal (C0B32HBD1M5)
- Vercel Cron in `vercel.json`: Mon 13:00 UTC, Tue-Thu 13:00 UTC, Fri 21:00 UTC
- Real-time trigger POST at `/api/notifications/triggers` (for n8n webhook, not wired yet)
- `notification_preferences` table on prod Supabase with RLS
- `UNIQUE` constraint on `user_roles.email` (prod)
- Settings UI at `/settings`: frequency/threshold controls per section, sidebar nav link
- Env vars on Vercel: MI_SALES_CHANNEL_ID, MI_CS_CHANNEL_ID, MI_INTERNAL_CHANNEL_ID, CRON_SECRET
- Preferences API uses `@supabase/ssr` createServerClient for cookie-based auth
- Tested: all 3 digest types delivered to all 3 Slack channels on production

### CS Intelligence Sidebar - deployed commit `cbb07d8`
- `CSInsights` type + `buildCSInsights()` in intelligence API route
- `cs-insights-section.tsx` sidebar component (health, sentiment, expansion, escalation, strategic signals)
- Renders only for companies with `client_meeting` data, null for others
- E2E verified with Playwright: Acme Corp shows CS Health, Barndoor does not

### Pipeline Triggers (CR-015) - deployed commit `cbb07d8`
- `detect_pipeline_triggers()` SQL function on prod Supabase
- `/api/notifications/triggers` GET route
- Detects: Duetto deal_slipping (health 8->0), IQVIA deal_accelerating (0->8), New Reward poor_discovery (score 4)

### Dev Environment
- 31 meetings migrated from prod to dev (6 companies: IQVIA, Barndoor, Franklin Alliance, Clay Labs, Boutique Recruiting, PartySlate)
- Dev now has 42 meetings across 14 companies
- `detect_pipeline_triggers()` function + `notification_preferences` table on dev

### Bug Fixes
- Preferences API auth: `createServerSupabase()` has no session - switched to `@supabase/ssr` `createServerClient`
- CRON_SECRET whitespace in Vercel env var caused build failure
- Channel ID env vars had trailing newlines from echo piping - re-added with printf

### Files Created
```
src/app/settings/page.tsx
src/app/api/notifications/digest/route.ts
src/app/api/notifications/preferences/route.ts
src/app/api/notifications/triggers/route.ts (extended with POST)
src/components/companies/intelligence-sidebar/cs-insights-section.tsx
migration/sql/2026-05-13-notification-preferences.sql
migration/sql/2026-05-13-pipeline-triggers.sql
vercel.json
```

### Files Modified
```
src/types/intelligence.ts (CSInsights interface, csInsights field)
src/app/api/companies/[name]/intelligence/route.ts (buildCSInsights)
src/components/companies/intelligence-sidebar/sidebar-content.tsx (CSInsightsSection)
src/lib/constants.ts (SECTION_CHANNEL_MAP, getSectionForStageType, Bell nav item)
src/components/layout/sidebar-nav.tsx (Bell icon, Notifications tool item)
.env.example (channel ID vars, CRON_SECRET)
docs/progress.md
```

### Memory Files Created
```
memory/feedback_real_data_testing.md
memory/feedback_supabase_auth_pattern.md
memory/project_notification_tradeoffs.md
```

## Current State
- **Git:** branch `main` at `cee29aa`, production remote in sync
- **Production:** dashboard-jet-seven-93.vercel.app (Sprint 1+2+3 deployed)
- **Tests:** 80/80 passing
- **Slack:** 3 channels active, bot invited, digests tested
- **Vercel Cron:** 3 schedules registered
- **Prod Supabase:** notification_preferences (3 rows), detect_pipeline_triggers(), email UNIQUE

## What's Next

### Immediate (no blockers)
- Wire n8n MI|3 to POST `/api/notifications/triggers` after scoring (real-time Slack alerts)
- Monitor first real client_meeting/internal_client_meeting from n8n 8h cycle

### Blocked (needs external input)
- CR-014: HubSpot Score Writeback (needs HubSpot API key with write permissions)
- CR-010: Teams Recording Capture MVP (needs Azure AD app registration + credentials)
- Stephen: Slack notification cadence/template refinements

### Future (client-readiness, documented in memory)
- Digest engine reads notification_preferences before sending
- Personal Slack DMs for critical alerts (needs slack_user_id on user_roles)
- Email delivery via Resend
- Notification history/audit log
- Notification batching/dedup

---

## Previous Session (2026-05-13, Session 1)

### Sprint 1: Foundation (deployed commit `30bf0f6`)
- Added 2 new stage types (`client_meeting`, `internal_client_meeting`) across 18 source + 4 test files
- Supabase RLS on `scored_meetings` with `get_user_stage_types()` function (production)
- `scoring_config` table created on both dev + production (6 rows with weights)
- Dev Supabase: all 7 MI tables replicated from production schema + 9 seed meetings
- Environment reference docs + CLAUDE.md safety rules

### Sprint 2: CS + Internal Scoring Frameworks (deployed commits `65c2b1e`, `de69842`)
- `CSScores` component: 7 weighted gauges (Overall Health + 6 categories) + strategic signal badges
- `EnhancedInternalScores` component: 5 weighted gauges (Effectiveness + 4 categories) + org signal badges
- Smart detection: `isCSRubricData()` detects new vs old JSONB format at runtime
- Backward compatible: old meetings render with existing gauges
- BANT/MEDDIC hidden from sidebar for non-sales meetings
- Score null safety: validates typeof number, caps at 10
- Rep page STAGE_COLORS updated for new types
- CS + Internal Enhanced LLM prompts written and tested with real LLM output
- End-to-end verified: n8n LLM -> Supabase -> Dashboard rendering (Playwright screenshots)

### n8n Pipeline Updates
- MI-DEV|3: All 6 stage types + Score CS + Score Internal Enhanced LLM chains
- MI|3 (production): Published v4.4 with Score CS + Score Internal Enhanced
  - Build Scoring Context: 6 stage classification with topic keyword fallback
  - Route by Stage: 7 outputs (6 LLM chains + fallback)
  - Process Scores: CS rubric (category_scores, strategic_signals, meetingScoreFull) + enhanced internal (enhanced_scoring, overall_effectiveness_score)
  - Format Slack Message: CS Check-In + Internal Client Meeting formats
  - Score CS -> Process Scores connection verified
  - Score Internal Enhanced -> Process Scores connection verified

### Change Requests Created
- CR-010: Microsoft Teams Recording Capture (separate MVP)
- CR-011: Notification and Digest System (Slack + email)
- CR-012: CS Scoring Framework (IMPLEMENTED in Sprint 2)
- CR-013: Internal Scoring Enhancement (IMPLEMENTED in Sprint 2)
- CR-014: HubSpot Score Writeback
- CR-015: Pipeline Trigger Alerts
- CR-016: Modular Pricing (DEFERRED)

### Files Created
```
change_requests/revision_2/CR-010.md through CR-016.md
teams-capture/README.md
migration/env-reference.md
migration/sql/2026-05-13-scored-meetings-rls.sql
migration/sql/2026-05-13-scoring-config.sql
migration/prompts/cs-scoring-prompt.txt
migration/prompts/internal-enhanced-prompt.txt
migration/prompts/process-scores-cs-block.js
migration/prompts/process-scores-internal-enhanced-block.js
```

### Files Modified (key)
```
src/types/scores.ts - CS + enhanced internal types, getPrimaryScore updated
src/components/meetings/score-section.tsx - CSScores, EnhancedInternalScores, SignalBadge
src/components/companies/intelligence-sidebar/ - stageType prop, BANT hidden for non-sales
src/lib/constants.ts - 6 stage types, SECTIONS updated
src/lib/utils/stage.ts - STAGE_SCORE_FIELDS for new types
15+ other files for stage type support
```

### Production Deploys
- Sprint 1: commit `30bf0f6` (24 files, +498 -55)
- Sprint 2: commit `65c2b1e` (10 files, +513 -19)
- Fix: commit `de69842` (rep page STAGE_COLORS)
- n8n MI|3: v4.3 (stage routing) then v4.4 (CS + Internal Enhanced LLM chains)

## Current State
- **Git:** branch `main`, production remote in sync at `de69842`
- **Production:** dashboard-jet-seven-93.vercel.app (Sprint 1 + 2 deployed)
- **Dev:** localhost:3003 with MI tables + seed data + CS rubric test data
- **Tests:** 80/80 passing
- **n8n prod:** MI|3 v4.4 active with 6 LLM chains
- **n8n dev:** MI-DEV|3 with same structure (dormant)
- **Supabase prod:** RLS active, scoring_config v2, 373 meetings
- **Supabase dev:** MI tables + 11 meetings (9 seed + 2 rubric test)

## What's Next

### Sprint 3: Notifications + HubSpot (CR-011, CR-014, CR-015)
1. CR-011: Notification preferences table + automated Slack triggers + email (Resend)
2. CR-014: HubSpot property audit + discovery writeback in n8n
3. CR-015: Pipeline trend detection SQL (deal slipping/accelerating)
- Three dedicated Slack channels: #mi-sales, #mi-cs, #mi-internal
- Complementary to existing manual Slack send (keep as-is)

### Sprint 4: Teams + Digests (CR-010)
4. CR-010: Teams MVP in teams-capture/ folder (Azure AD auth, separate from MI product)
5. CR-011 Phase 3: Digest engine (daily/weekly summaries)

### Pending Items
- [ ] Monitor next n8n 8h cycle for first real client_meeting/internal_client_meeting scoring
- [ ] Dev GitHub remote (say2neeraj) repo not found - needs fix or removal
- [ ] Stephen still pending: Slack notification cadence and template requirements
- [ ] Vercel GitHub App not installed on neerajkumar-builds org

## Key Decisions Made This Session
1. Teams integration: separate MVP first, central auth pattern
2. Notifications: complementary to manual Slack, three dedicated channels, Slack + email
3. Scoring: all 3 layers required (n8n + Supabase + Frontend)
4. CS rubric: 6 weighted categories from Stephen's doc
5. Internal rubric: 4+2 categories from Stephen's doc, backward compatible via optional enhanced_scoring
6. BANT/MEDDIC: hidden for non-sales meetings
7. No quick fixes ever: full implementation with proper testing before production
- **Operator:** Neeraj + Claude Opus 4.6
- **Type:** Product meeting analysis + CR creation (no code changes)

## What Was Done (2026-05-12)

### Product Meeting Analysis
- Analyzed product meeting notes (Matthew CEO, Stephen COO, Luke)
- Key decision: Pause Content Intelligence Agent, focus exclusively on MI
- Read Stephen's CS and Internal scoring rubrics (docx files)
- Analyzed scoring architecture: n8n + Supabase + Frontend all required

### 7 New Change Requests Created (Revision 2)
Located in `/change_requests/revision_2/`:
1. **CR-010:** Microsoft Teams Recording Capture (High, separate MVP)
2. **CR-011:** Notification and Digest System (Critical, complementary to manual Slack)
3. **CR-012:** CS Scoring Framework (High, rubric delivered, 6 weighted categories)
4. **CR-013:** Internal Call Scoring Enhancement (Medium, rubric delivered, 4+2 categories)
5. **CR-014:** HubSpot Score Writeback (High, discovery can start)
6. **CR-015:** Pipeline Trigger Alerts (High, trend detection SQL)
7. **CR-016:** Modular Pricing (Low, DEFERRED placeholder)

### Architecture Decisions
- Teams: Separate MVP in `teams-capture/` folder, central auth pattern
- Notifications: Complementary to manual Slack, three dedicated channels, Slack + email
- Scoring: Store prompts in Supabase `scoring_config` table for configurability
- HubSpot: Internal meetings NEVER write back (privacy)

### Files Created
```
change_requests/revision_2/CR-010.md
change_requests/revision_2/CR-011.md
change_requests/revision_2/CR-012.md
change_requests/revision_2/CR-013.md
change_requests/revision_2/CR-014.md
change_requests/revision_2/CR-015.md
change_requests/revision_2/CR-016.md
teams-capture/README.md
```

### Files Updated
```
dashboard/migration/knowledge-graph.yaml (added CR-010-016 impact entries + decisions)
dashboard/migration/session-handover.md (this file)
```

### Memory Updated
- project_revision2_decisions.md - Meeting decisions and architecture choices
- feedback_deployment_hygiene.md - SOP hygiene requirements
- feedback_subagent_execution.md - Phase checkpoint + sub-agent execution strategy

## What's Next

### Sprint 1: Foundation (Immediate)
1. Add 2 new stage types to n8n (client_meeting, internal_client_meeting)
2. Update dashboard constants (STAGE_CONFIG, SECTIONS)
3. Supabase RLS on scored_meetings
4. Create scoring_config table in Supabase
5. Create #meeting-intel-dev Slack channel
6. Vercel GitHub App installation

### Sprint 2: Scoring Frameworks
7. CR-012: CS scoring n8n prompt + TypeScript types + CSScores component
8. CR-013: Internal scoring enhancement + backward-compatible JSONB extension

### Sprint 3: Notifications + HubSpot
9. CR-011: Notification preferences + automated triggers + Slack channels + email
10. CR-014: HubSpot property audit + discovery writeback
11. CR-015: Pipeline trend detection SQL

### Sprint 4: Teams + Digests
12. CR-010: Teams MVP (Azure AD auth, user listing, transcript extraction)
13. CR-011 Phase 3: Digest engine (daily/weekly)

### Execution Strategy
- Phase checkpoints with verification criteria and rollback plans
- Sub-agents for independent phases (no file overlap)
- Accuracy > speed - test in dev, ask before deploying
- No simultaneous n8n + dashboard changes

## Team Coordination
- Check-in: 2026-05-13 10:30 AM EST
- In-person meeting: week of 2026-05-19
- Stephen deliverables still pending: Slack notification cadence/templates
- Neeraj provides: Azure AD credentials, HubSpot API key during implementation

---

## Previous Session (2026-05-04)
- **Duration:** ~6 hours

## What Was Done

### All 9 CRs Implemented and Deployed
1. **CR-004:** Remove internal meetings from analysis (privacy/compliance)
2. **CR-005:** Score reason summaries below gauges
3. **CR-009:** Meeting detail page declutter
4. **CR-002:** Top 5 strengths/improvements on rep page
5. **CR-003:** Date range filter with calendar range picker on rep page
6. **CR-007:** Intelligence panel expanded by default
7. **CR-008:** BANT + MEDDIC dual framework display
8. **CR-006:** Zoom play URL + download with passcode disclaimer
9. **CR-001:** Section-based sidebar (All/Sales/CS/Internal)

### CR-001 Refinement (12 Gaps Fixed)
- Page titles reflect active section
- Section-specific Ask Blarney prompts
- Smart hybrid Ask Blarney (section context in LLM prompt)
- Stage filter dropdowns filtered per section
- Internal insights conditional on section
- Ask Blarney buttons use section context
- "All Analysis" section for leadership
- Em dashes removed from entire codebase

### Admin Panel with RBAC
- `/admin` page with user management table
- Single-step user creation (auth + role via SUPABASE_SERVICE_ROLE_KEY)
- Edit role, toggle section access, deactivate users
- Admin password reset (key icon)
- Self-deactivation prevention
- Minimum 1 section required

### User Profile and Auth
- User profile menu (initials dropdown in header)
- Edit Profile dialog (name, password change)
- Forgot password on login page (email reset + recovery form)
- Deactivated user blocking (loading guard prevents dashboard flash)
- Per-user chat history (localStorage keyed by email)
- Sign out without confirmation popup

### Brand Alignment
- Stage badges: brand-derived colors (no more purple)
- Chart colors: Follow-Up uses brand black instead of purple
- Brand audit documented at `migration/brand-audit.md`

## Current State
- **Git:** branch `main`, both remotes in sync
- **Production:** dashboard-jet-seven-93.vercel.app (all features deployed)
- **Dev:** localhost:3003 (same code)
- **Tests:** 80/80 passing
- **CRs:** All 9 completed
- **Supabase:** user_roles table on both dev + prod with RLS

## Files Created This Session
```
src/app/admin/page.tsx
src/app/api/admin/users/route.ts
src/components/layout/user-menu.tsx
src/lib/hooks/use-section-meetings.ts
src/lib/section-context.tsx
migration/sql/2026-05-04-user-roles.sql
migration/architecture-vision.md
migration/brand-audit.md
migration/product-team-feedback.md
```

## What's Next

### 1. n8n Pipeline: Add 2 New Stage Types
**Why:** The naming convention defines 6 meeting types but the system only has 4. CS section only has "onboarding" meetings. Adding `client_meeting` and `internal_client_meeting` gives full coverage.

**Steps:**
1. Open MI|3 scoring workflow in n8n
2. Find the node that assigns `scoring_stage_type`
3. Update the classification prompt/logic to use keyword matching from naming convention:

| Meeting Type | Keywords | Stage Type Value |
|---|---|---|
| Discovery Call | Intro, Discovery, Exploration, Scoping | `discovery_scoping` |
| Follow-Up Call | Follow-Up, Proposal | `follow_up` |
| Client Onboarding | Onboarding, Kick-Off | `onboarding` |
| Client Meeting | Check-In | `client_meeting` (NEW) |
| Internal Client Meeting | Internal Check-In | `internal_client_meeting` (NEW) |
| Internal Meeting | Sync, 1:1 | `internal` |
| No keyword | - | Skip/ignore meeting |

4. Test on dev n8n (MI-DEV|3) with a few meetings
5. Verify dev Supabase has correct stage types assigned
6. Apply same change to production MI|3
7. Backfill existing NULL meetings: run this SQL to classify by topic keywords:
```sql
UPDATE scored_meetings SET scoring_stage_type = 'internal'
WHERE scoring_stage_type IS NULL
AND (topic ILIKE '%sync%' OR topic ILIKE '%1:1%' OR topic ILIKE '%standup%');
```

8. After n8n changes, update dashboard constants:
```typescript
// In src/lib/constants.ts, add to ScoringStageType:
| "client_meeting"
| "internal_client_meeting"

// Add to STAGE_CONFIG:
client_meeting: { label: "Check-In", ... }
internal_client_meeting: { label: "Internal Check-In", ... }

// Update SECTIONS:
cs: { stageTypes: ["onboarding", "client_meeting"] }
internal: { stageTypes: ["internal", "internal_client_meeting"] }
```

### 2. Supabase RLS on scored_meetings (Per-User Section Access)
**Why:** Currently RBAC is UI-only. A tech-savvy user could call APIs directly and bypass section restrictions. RLS enforces at the database level.

**Steps:**
1. Create a function that maps user email to allowed stage types:
```sql
CREATE OR REPLACE FUNCTION get_user_stage_types()
RETURNS text[] AS $$
DECLARE
  sections text[];
  stage_types text[] := '{}';
BEGIN
  SELECT allowed_sections INTO sections
  FROM user_roles
  WHERE email = auth.jwt()->>'email';

  IF sections IS NULL THEN RETURN ARRAY['discovery_scoping','follow_up','onboarding','internal']; END IF;

  IF 'all' = ANY(sections) THEN
    RETURN ARRAY['discovery_scoping','follow_up','onboarding','internal','client_meeting','internal_client_meeting'];
  END IF;

  IF 'sales' = ANY(sections) THEN
    stage_types := stage_types || ARRAY['discovery_scoping','follow_up'];
  END IF;
  IF 'cs' = ANY(sections) THEN
    stage_types := stage_types || ARRAY['onboarding','client_meeting'];
  END IF;
  IF 'internal' = ANY(sections) THEN
    stage_types := stage_types || ARRAY['internal','internal_client_meeting'];
  END IF;

  RETURN stage_types;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. Enable RLS on scored_meetings:
```sql
ALTER TABLE scored_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see meetings in their sections" ON scored_meetings
  FOR SELECT USING (
    scoring_stage_type = ANY(get_user_stage_types())
    OR scoring_stage_type IS NULL
  );
```

3. Enable RLS on meetings_list view (may need to convert to a table or use a function):
   - Views don't support RLS directly
   - Option: create a Supabase function `get_meetings_list()` that filters by stage types
   - Or: apply RLS on the underlying `scored_meetings` table (the view reads from it)

4. Test with different user roles on dev before applying to production

**Caution:** Test thoroughly. If RLS blocks n8n from writing to scored_meetings, add a policy:
```sql
CREATE POLICY "Service role can do anything" ON scored_meetings
  FOR ALL USING (auth.role() = 'service_role');
```

### 3. Open Items
- [ ] Vercel GitHub App not installed on neerajkumar-builds (still using CLI deploy)
- [ ] Personal Vercel not redeployed with current code
- [ ] `#meeting-intel-dev` Slack channel not created
- [ ] `.migration/env-production` file not created (blocks `/mi-seed-dev`)

## Decisions Made This Session
1. BANT as primary framework (Stephen uses it), MEDDIC as secondary
2. Section-based sidebar over route groups (simpler, no file restructure)
3. Smart hybrid Ask Blarney (section context in LLM prompt, full data access)
4. Admin panel over manual Supabase user management
5. Email-based role lookup (not user_id) for easier pre-provisioning
6. Loading guard over middleware for deactivated user blocking
7. Brand colors: blue-based palette, no purple
