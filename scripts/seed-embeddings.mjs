import { createClient } from '@supabase/supabase-js';

const PROD_URL = 'https://cxrjlmquzhfueqrudiuy.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4cmpsbXF1emhmdWVxcnVkaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDU5MzYsImV4cCI6MjA3MTc4MTkzNn0.-4xYkqOxyrVXdwi8iZCY00UCBGHw9AoKgXODchXSxfY';

const DEV_URL = 'https://burcfsxsxgabknmodsrd.supabase.co';
const DEV_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cmNmc3hzeGdhYmtubW9kc3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODI0NjgsImV4cCI6MjA5MjQ1ODQ2OH0.NlgwY34bqIv1kMZcG9esaZw3mlOBMF1VLHwUCz__o_E';

const prod = createClient(PROD_URL, PROD_KEY);
const dev = createClient(DEV_URL, DEV_KEY);

async function seedEmbeddings() {
  console.log('=== Seeding Embeddings ===\n');

  // 1. scored_meetings summary_embedding
  console.log('scored_meetings.summary_embedding...');
  let offset = 0;
  let totalSm = 0;
  while (true) {
    const { data, error } = await prod.from('scored_meetings')
      .select('id,summary_embedding')
      .not('summary_embedding', 'is', null)
      .range(offset, offset + 49);
    if (error) { console.error('  READ:', error.message); break; }
    if (!data?.length) break;

    for (const row of data) {
      const { error: ue } = await dev.from('scored_meetings')
        .update({ summary_embedding: row.summary_embedding })
        .eq('id', row.id);
      if (ue) console.error('  UPDATE:', ue.message);
      else totalSm++;
    }
    offset += data.length;
    process.stdout.write(`  Updated ${totalSm} rows\r`);
  }
  console.log(`  Done: ${totalSm} embeddings`);

  // 2. meeting_chunks chunk_embedding
  console.log('\nmeeting_chunks.chunk_embedding...');
  offset = 0;
  let totalMc = 0;
  while (true) {
    const { data, error } = await prod.from('meeting_chunks')
      .select('id,chunk_embedding')
      .not('chunk_embedding', 'is', null)
      .range(offset, offset + 49);
    if (error) { console.error('  READ:', error.message); break; }
    if (!data?.length) break;

    for (const row of data) {
      const { error: ue } = await dev.from('meeting_chunks')
        .update({ chunk_embedding: row.chunk_embedding })
        .eq('id', row.id);
      if (ue) console.error('  UPDATE:', ue.message);
      else totalMc++;
    }
    offset += data.length;
    process.stdout.write(`  Updated ${totalMc} rows\r`);
  }
  console.log(`  Done: ${totalMc} embeddings`);

  console.log('\n=== Summary ===');
  console.log(`  scored_meetings embeddings: ${totalSm}`);
  console.log(`  meeting_chunks embeddings: ${totalMc}`);
  console.log('  RAG search (Ask Blarney) should now work on dev.');
}

seedEmbeddings().catch(console.error);
