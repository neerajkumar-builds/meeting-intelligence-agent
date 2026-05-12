# Session Handover: Meeting Intelligence

## Last Session
- **Date:** 2026-05-12
- **Duration:** ~2 hours
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
