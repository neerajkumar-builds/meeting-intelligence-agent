-- Pipeline Trigger Detection Function (CR-015 Phase 3.6)
-- Read-only window function comparing consecutive meetings per company.
-- Detects: deal slipping, deal accelerating, poor discovery calls.
-- Apply to DEV first, then PROD after verification.

CREATE OR REPLACE FUNCTION detect_pipeline_triggers()
RETURNS TABLE (
  company_name text,
  trigger_type text,
  current_meeting_id text,
  previous_meeting_id text,
  current_score numeric,
  previous_score numeric,
  score_delta numeric,
  urgency text,
  details jsonb
) AS $$
WITH ranked AS (
  SELECT
    sm.company_name,
    sm.id::text,
    sm.client_health_score,
    sm.overall_score,
    (sm.meeting_score::jsonb->>'deal_sentiment') as deal_sentiment,
    sm.scoring_stage_type,
    sm.scored_at,
    ROW_NUMBER() OVER (
      PARTITION BY sm.company_name ORDER BY sm.scored_at DESC
    ) as rn
  FROM scored_meetings sm
  WHERE sm.scoring_stage_type IN ('discovery_scoping', 'follow_up', 'client_meeting')
    AND sm.company_name IS NOT NULL
    AND sm.company_name != ''
    AND sm.scored_at IS NOT NULL
)

-- Deal slipping: health score dropped more than 2 points
SELECT
  curr.company_name,
  'deal_slipping'::text as trigger_type,
  curr.id as current_meeting_id,
  prev.id as previous_meeting_id,
  curr.client_health_score as current_score,
  prev.client_health_score as previous_score,
  curr.client_health_score - prev.client_health_score as score_delta,
  'high'::text as urgency,
  jsonb_build_object(
    'current_sentiment', curr.deal_sentiment,
    'current_stage', curr.scoring_stage_type,
    'previous_stage', prev.scoring_stage_type
  ) as details
FROM ranked curr
JOIN ranked prev
  ON curr.company_name = prev.company_name AND prev.rn = curr.rn + 1
WHERE curr.rn = 1
  AND prev.client_health_score IS NOT NULL
  AND curr.client_health_score IS NOT NULL
  AND (curr.client_health_score - prev.client_health_score) < -2

UNION ALL

-- Deal accelerating: health score rose more than 2 points
SELECT
  curr.company_name,
  'deal_accelerating'::text,
  curr.id,
  prev.id,
  curr.client_health_score,
  prev.client_health_score,
  curr.client_health_score - prev.client_health_score,
  'medium'::text,
  jsonb_build_object(
    'current_sentiment', curr.deal_sentiment,
    'current_stage', curr.scoring_stage_type,
    'previous_stage', prev.scoring_stage_type
  )
FROM ranked curr
JOIN ranked prev
  ON curr.company_name = prev.company_name AND prev.rn = curr.rn + 1
WHERE curr.rn = 1
  AND prev.client_health_score IS NOT NULL
  AND curr.client_health_score IS NOT NULL
  AND (curr.client_health_score - prev.client_health_score) > 2

UNION ALL

-- Poor discovery: discovery meeting with overall score below 5
SELECT
  sm.company_name,
  'poor_discovery'::text,
  sm.id::text,
  NULL::text,
  sm.overall_score,
  NULL::numeric,
  NULL::numeric,
  'high'::text,
  jsonb_build_object(
    'stage', sm.scoring_stage_type,
    'topic', sm.topic
  )
FROM scored_meetings sm
WHERE sm.scoring_stage_type = 'discovery_scoping'
  AND sm.overall_score < 5
  AND sm.company_name IS NOT NULL
  AND sm.company_name != ''
  AND sm.scored_at >= NOW() - INTERVAL '90 days';

$$ LANGUAGE sql SECURITY DEFINER;
