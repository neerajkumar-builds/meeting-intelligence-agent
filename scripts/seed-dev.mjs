import { createClient } from '@supabase/supabase-js';

const PROD_URL = 'https://cxrjlmquzhfueqrudiuy.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4cmpsbXF1emhmdWVxcnVkaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDU5MzYsImV4cCI6MjA3MTc4MTkzNn0.-4xYkqOxyrVXdwi8iZCY00UCBGHw9AoKgXODchXSxfY';

const DEV_URL = 'https://burcfsxsxgabknmodsrd.supabase.co';
const DEV_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cmNmc3hzeGdhYmtubW9kc3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODI0NjgsImV4cCI6MjA5MjQ1ODQ2OH0.NlgwY34bqIv1kMZcG9esaZw3mlOBMF1VLHwUCz__o_E';

const prod = createClient(PROD_URL, PROD_KEY);
const dev = createClient(DEV_URL, DEV_KEY);

async function seedTable(tableName, options = {}) {
  const { selectColumns, orderBy, limit, batchSize = 50 } = options;

  console.log(`\nSeeding ${tableName}...`);

  let query = prod.from(tableName).select(selectColumns || '*');
  if (orderBy) query = query.order(orderBy, { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) { console.error(`  READ ERROR: ${error.message}`); return 0; }
  if (!data?.length) { console.log(`  No data to seed`); return 0; }

  console.log(`  Read ${data.length} rows from production`);

  let inserted = 0;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error: insertError } = await dev.from(tableName).upsert(batch, { onConflict: 'id' });
    if (insertError) {
      console.error(`  INSERT ERROR (batch ${i}): ${insertError.message}`);
    } else {
      inserted += batch.length;
      process.stdout.write(`  Inserted ${inserted}/${data.length}\r`);
    }
  }
  console.log(`  Done: ${inserted} rows inserted`);
  return inserted;
}

async function main() {
  console.log('=== Meeting Intelligence Dev Seeder ===');
  console.log(`Source: ${PROD_URL}`);
  console.log(`Target: ${DEV_URL}`);

  const results = {};

  results.zoom_users = await seedTable('zoom_users');

  results.scoring_run_log = await seedTable('scoring_run_log', {
    orderBy: 'run_started_at',
    limit: 20
  });

  results.scored_meetings = await seedTable('scored_meetings', {
    selectColumns: [
      'id', 'meeting_uuid', 'host_email', 'host_name', 'topic',
      'start_time', 'duration_minutes', 'meeting_stage',
      'participant_emails', 'primary_participant_email', 'primary_participant_name',
      'hubspot_contact_id', 'hubspot_company_id', 'company_name', 'company_domain',
      'recording_url', 'transcript_url', 'has_transcript', 'transcript_text',
      'rep_score', 'meeting_score', 'icp_score', 'overall_score',
      'google_doc_url', 'meeting_summary', 'hubspot_updated',
      'secondary_contacts_updated', 'status', 'error_message',
      'scoring_model', 'scored_at', 'captured_at', 'updated_at',
      'participant_names', 'word_count', 'ai_extracted_participants',
      'ai_meeting_theme', 'resolution_method',
      'engagement_score', 'delivery_score', 'client_health_score',
      'scoring_stage_type', 'internal_summary', 'embedded_at'
    ].join(','),
    batchSize: 20
  });

  results.meeting_chunks = await seedTable('meeting_chunks', {
    selectColumns: 'id,meeting_id,chunk_index,chunk_text,metadata,created_at',
    batchSize: 50
  });

  console.log('\n=== Seed Summary ===');
  for (const [table, count] of Object.entries(results)) {
    console.log(`  ${table}: ${count} rows`);
  }
  console.log('\nNote: Embedding columns (summary_embedding, chunk_embedding) skipped.');
  console.log('RAG search will not work until embeddings are populated.');
  console.log('All other dashboard features will work normally.');
}

main().catch(console.error);
