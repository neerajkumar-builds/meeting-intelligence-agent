-- Phase 1.2: Row Level Security on scored_meetings
-- Enforces section-based access at database level (previously UI-only)
--
-- SAFETY: n8n uses service_role key which bypasses RLS entirely.
-- Dashboard uses anon key + auth JWT which RLS applies to.
-- TEST ON DEV SUPABASE FIRST before applying to production.

-- Step 1: Function that maps user's allowed_sections to allowed stage types
-- Uses the same section->stageTypes mapping as dashboard SECTIONS constant
CREATE OR REPLACE FUNCTION get_user_stage_types()
RETURNS text[] AS $$
DECLARE
  sections text[];
  stage_types text[] := '{}';
BEGIN
  SELECT allowed_sections INTO sections
  FROM user_roles
  WHERE email = auth.jwt()->>'email'
    AND is_active = true;

  -- No role found: return all types (fail-open for safety during rollout)
  IF sections IS NULL THEN
    RETURN ARRAY[
      'discovery_scoping', 'follow_up', 'onboarding',
      'client_meeting', 'internal_client_meeting', 'internal'
    ];
  END IF;

  -- "all" section grants access to everything
  IF 'all' = ANY(sections) THEN
    RETURN ARRAY[
      'discovery_scoping', 'follow_up', 'onboarding',
      'client_meeting', 'internal_client_meeting', 'internal'
    ];
  END IF;

  -- Map sections to stage types (mirrors dashboard SECTIONS constant)
  IF 'sales' = ANY(sections) THEN
    stage_types := stage_types || ARRAY['discovery_scoping', 'follow_up'];
  END IF;
  IF 'cs' = ANY(sections) THEN
    stage_types := stage_types || ARRAY['onboarding', 'client_meeting'];
  END IF;
  IF 'internal' = ANY(sections) THEN
    stage_types := stage_types || ARRAY['internal', 'internal_client_meeting'];
  END IF;

  RETURN stage_types;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Enable RLS on scored_meetings
ALTER TABLE scored_meetings ENABLE ROW LEVEL SECURITY;

-- Step 3: Service role bypass (n8n writes use this)
CREATE POLICY "Service role has full access" ON scored_meetings
  FOR ALL USING (auth.role() = 'service_role');

-- Step 4: Authenticated users see meetings in their allowed sections
CREATE POLICY "Users see meetings in their sections" ON scored_meetings
  FOR SELECT USING (
    scoring_stage_type = ANY(get_user_stage_types())
    OR scoring_stage_type IS NULL
  );

-- Step 5: Verify meetings_list view inherits RLS
-- The meetings_list view reads from scored_meetings.
-- With RLS enabled on the base table, the view automatically
-- respects the policies when queried by authenticated users.
-- No additional action needed for the view.

-- ROLLBACK (if something breaks):
-- DROP POLICY IF EXISTS "Users see meetings in their sections" ON scored_meetings;
-- DROP POLICY IF EXISTS "Service role has full access" ON scored_meetings;
-- ALTER TABLE scored_meetings DISABLE ROW LEVEL SECURITY;
-- DROP FUNCTION IF EXISTS get_user_stage_types();
