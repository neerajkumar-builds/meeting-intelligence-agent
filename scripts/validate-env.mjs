import { readFileSync } from 'fs';

try {
  const envLocal = readFileSync('.env.local', 'utf8');
  for (const line of envLocal.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const PROD_SUPABASE_REF = 'cxrjlmquzhfueqrudiuy';

const REQUIRED = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', pattern: /^https:\/\/.*supabase\.co/ },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', pattern: /^eyJ/ },
  { name: 'ANTHROPIC_API_KEY', pattern: /^sk-ant-/ },
];

const FEATURE = [
  { name: 'GEMINI_API_KEY', pattern: /^AIza/, note: 'RAG search (Ask Blarney) will not work' },
  { name: 'CHAT_MODEL', pattern: /^claude-/, note: 'defaults to claude-sonnet-4-20250514' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', pattern: /^eyJ/, note: 'digest engine, preferences API, admin routes will not work' },
  { name: 'CRON_SECRET', note: 'Vercel Cron digest jobs will fail auth' },
  { name: 'MI_SALES_CHANNEL_ID', pattern: /^C/, note: 'Sales digest delivery will not work' },
  { name: 'MI_CS_CHANNEL_ID', pattern: /^C/, note: 'CS digest delivery will not work' },
  { name: 'MI_INTERNAL_CHANNEL_ID', pattern: /^C/, note: 'Internal digest delivery will not work' },
];

const OPTIONAL = [
  { name: 'SLACK_WEBHOOK_URL', pattern: /^https:\/\/hooks\.slack\.com/ },
  { name: 'SLACK_BOT_TOKEN', pattern: /^xoxb-/ },
  { name: 'SLACK_ALLOWED_CHANNELS' },
  { name: 'DAILY_QUERY_LIMIT', pattern: /^\d+$/ },
  { name: 'BURST_QUERY_LIMIT', pattern: /^\d+$/ },
  { name: 'NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS', pattern: /^\d+$/ },
];

let errors = 0;
let warnings = 0;

console.log('\nENV VALIDATION');
console.log('==============\n');

for (const v of REQUIRED) {
  const val = process.env[v.name];
  if (!val) {
    console.log(`[FAIL]  ${v.name} -- MISSING (required)`);
    errors++;
  } else if (v.pattern && !v.pattern.test(val)) {
    console.log(`[FAIL]  ${v.name} -- invalid format (expected ${v.pattern})`);
    errors++;
  } else {
    console.log(`[OK]    ${v.name}`);
  }
}

for (const v of FEATURE) {
  const val = process.env[v.name];
  if (!val) {
    console.log(`[WARN]  ${v.name} -- missing (${v.note})`);
    warnings++;
  } else if (v.pattern && !v.pattern.test(val)) {
    console.log(`[WARN]  ${v.name} -- unexpected format`);
    warnings++;
  } else {
    console.log(`[OK]    ${v.name}`);
  }
}

for (const v of OPTIONAL) {
  const val = process.env[v.name];
  if (!val) {
    console.log(`[SKIP]  ${v.name}`);
  } else if (v.pattern && !v.pattern.test(val)) {
    console.log(`[WARN]  ${v.name} -- unexpected format`);
    warnings++;
  } else {
    console.log(`[OK]    ${v.name}`);
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (supabaseUrl.includes(PROD_SUPABASE_REF) && !process.env.VERCEL) {
  console.log(`\n[!!]    LOCAL ENV POINTS TO PRODUCTION SUPABASE`);
  console.log(`        URL contains ${PROD_SUPABASE_REF} (production project)`);
  console.log(`        If this is intentional, ignore. Otherwise fix .env.local.`);
  warnings++;
}

console.log(`\nRESULT: ${errors === 0 ? 'PASS' : 'FAIL'} -- ${REQUIRED.length - errors}/${REQUIRED.length} required vars present. ${warnings} warning(s).\n`);

if (errors > 0) {
  process.exit(1);
}
