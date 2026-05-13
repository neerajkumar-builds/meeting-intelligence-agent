// REPLACE the existing `if (sst === 'internal_client_meeting')` block
// AND optionally the `if (sst === 'internal')` block in Process Scores
// when you swap to the enhanced internal rubric prompt.
//
// The enhanced prompt outputs the SAME structure as the current internal prompt
// PLUS an `enhanced_scoring` object with category scores and org signals.
// This means internal_summary_full contains both old and new fields.
// The dashboard detects enhanced_scoring and renders 4 gauges if present,
// falls back to single gauge if absent.

if (sst === 'internal_client_meeting' || sst === 'internal') {
  const q = parsed.quality || {};
  const enhanced = parsed.enhanced_scoring || null;

  if (parseError) { q.meeting_quality_score = 0; }

  // Use enhanced effectiveness score if available, fall back to quality score
  const primaryScore = enhanced?.overall_effectiveness_score || q.meeting_quality_score || 0;

  return { json: {
    ...context,
    scoring_stage_type: sst,
    write_to_hubspot: false,
    meeting_outcome_score: primaryScore,
    deal_sentiment: q.productivity_rating || 'N/A',
    meeting_score_full: q,
    rep_performance_score: 0,
    rep_quality_rating: 'N/A',
    rep_score_full: null,
    icp_fit_score: 0,
    icp_reason: 'N/A',
    icp_score_full: null,
    overall_score: primaryScore,
    engagement_score_full: null,
    delivery_score_full: null,
    client_health_score: null,
    // The full parsed output includes enhanced_scoring nested inside
    internal_summary_full: parsed,
    google_doc_url: googleDocUrl,
    parse_error: parseError,
    scoring_summary: 'Effectiveness: ' + primaryScore + '/10 (' + (q.productivity_rating || 'N/A') + ')',
    call_notes: null,
    meeting_summary_text: (parsed.summary || {}).headline || ''
  }};
}