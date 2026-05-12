-- Phase 1.3: Scoring configuration table
-- Stores LLM scoring prompts per stage type so rubric changes
-- don't require n8n workflow edits.
--
-- n8n MI|3 reads prompt_template from this table by stage_type.
-- Dashboard does NOT read this table - it's n8n infrastructure.
-- New table, no existing data risk.

CREATE TABLE IF NOT EXISTS scoring_config (
  id serial PRIMARY KEY,
  stage_type text NOT NULL UNIQUE,
  prompt_template text NOT NULL,
  output_schema jsonb,
  weights jsonb,
  version int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scoring_config_stage_type
  ON scoring_config(stage_type);

-- RLS: service_role (n8n) has full access, dashboard users can read
ALTER TABLE scoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access" ON scoring_config
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read scoring config" ON scoring_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- Seed with stage types (prompts to be filled during Sprint 2)
INSERT INTO scoring_config (stage_type, prompt_template, weights, version)
VALUES
  ('discovery_scoping', 'PLACEHOLDER - existing prompt in n8n MI|3', NULL, 1),
  ('follow_up', 'PLACEHOLDER - existing prompt in n8n MI|3', NULL, 1),
  ('onboarding', 'PLACEHOLDER - existing prompt in n8n MI|3', NULL, 1),
  ('client_meeting', 'PLACEHOLDER - CS rubric prompt (CR-012)',
    '{"relationship_building": 0.15, "operational_updates": 0.15, "outcome_review": 0.20, "problem_solving": 0.25, "customer_sentiment": 0.15, "closing_next_steps": 0.10}'::jsonb,
    1),
  ('internal_client_meeting', 'PLACEHOLDER - same as internal for now', NULL, 1),
  ('internal', 'PLACEHOLDER - internal rubric prompt (CR-013)',
    '{"participation_engagement": 0.30, "strategic_alignment": 0.30, "clarifying_questions": 0.15, "action_items_accountability": 0.25}'::jsonb,
    1)
ON CONFLICT (stage_type) DO NOTHING;

-- ROLLBACK:
-- DROP TABLE IF EXISTS scoring_config;
