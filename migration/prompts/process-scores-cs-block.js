// REPLACE the existing `if (sst === 'client_meeting')` block in Process Scores
// with this code when you swap the LLM chain to the CS rubric prompt.
// The key difference: CS rubric outputs category_scores + strategic_signals
// instead of delivery/rep_performance/client_satisfaction.

if (sst === 'client_meeting') {
  const cs = parsed.category_scores || {};
  const ss = parsed.strategic_signals || {};
  const coaching = parsed.coaching_signals || {};
  const rs = parsed.rep_performance || {};
  const cn = parsed.call_notes || {};

  if (parseError) { rs.rep_performance_score = 0; }

  const healthScore = parsed.overall_health_score || 0;
  const sentimentScore = parsed.sentiment_score || 0;
  const repScore = rs.rep_performance_score || 0;
  const ov = Math.round((healthScore + repScore + sentimentScore) / 3 * 10) / 10;

  // Store the full CS rubric in meeting_score JSONB
  const meetingScoreFull = {
    category_scores: cs,
    overall_health_score: healthScore,
    strategic_signals: ss,
    coaching_signals: coaching,
    reasoning_summary: parsed.reasoning_summary || '',
    sentiment_score: sentimentScore,
    relationship_health_score: parsed.relationship_health_score || 0,
    expansion_likelihood: parsed.expansion_likelihood || 'N/A',
    escalation_risk: parsed.escalation_risk || 'N/A'
  };

  return { json: {
    ...context,
    scoring_stage_type: sst,
    write_to_hubspot: false,
    meeting_outcome_score: healthScore,
    deal_sentiment: parsed.escalation_risk === 'High' ? 'At Risk' : parsed.expansion_likelihood === 'High' ? 'Expanding' : 'Stable',
    meeting_score_full: meetingScoreFull,
    rep_performance_score: repScore,
    rep_quality_rating: rs.meeting_quality_rating || 'N/A',
    rep_score_full: rs,
    icp_fit_score: 0,
    icp_reason: 'N/A',
    icp_score_full: null,
    overall_score: ov,
    engagement_score_full: null,
    delivery_score_full: null,
    client_health_score: healthScore,
    internal_summary_full: null,
    google_doc_url: googleDocUrl,
    parse_error: parseError,
    scoring_summary: 'CS Health: ' + healthScore + '/10 | Sentiment: ' + sentimentScore + '/10 | Rep: ' + repScore + '/10',
    call_notes: cn
  }};
}