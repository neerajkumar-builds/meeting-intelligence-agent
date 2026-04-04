# Setup Guide

> Meeting Intelligence Dashboard -- FullFunnel Internal Initiative
>
> Last updated: 2026-04-04

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Variables](#environment-variables)
4. [Supabase Configuration](#supabase-configuration)
5. [npm Scripts](#npm-scripts)
6. [Vercel Deployment](#vercel-deployment)
7. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed and configured:

### Required Software

| Software | Minimum Version | Tested On | Installation |
|---|---|---|---|
| Node.js | 18+ | 22.x | [nodejs.org](https://nodejs.org) or `nvm install 22` |
| npm | 9+ | 10.x (bundled with Node 22) | Bundled with Node.js |
| Git | 2.x | Any recent | [git-scm.com](https://git-scm.com) |

### Required Accounts and API Keys

| Service | What You Need | Where to Get It |
|---|---|---|
| **Supabase** | A project with pgvector extension enabled | [supabase.com](https://supabase.com) -- create a new project |
| **Anthropic** | API key for Claude Sonnet 4 | [console.anthropic.com](https://console.anthropic.com) -- Settings > API Keys |
| **Google Gemini** | API key for embedding generation | [aistudio.google.com](https://aistudio.google.com) -- Get API Key |

### Optional Accounts

| Service | What You Need | Purpose |
|---|---|---|
| **Slack** | Bot token with `channels:read` scope | Enables Slack channel picker for sharing insights |
| **Slack** | Incoming webhook URL | Enables sending meeting summaries to Slack channels |
| **Vercel** | Account connected to GitHub | Production deployment (can use any host that supports Next.js) |

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url> meeting-intelligence-dashboard
cd meeting-intelligence-dashboard
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all 22 production and 16 dev dependencies. The install should take 30-60 seconds on a typical connection.

If you see peer dependency warnings, they are safe to ignore -- Next.js 16 and React 19 are bleeding edge and some packages have not updated their peer dependency ranges yet.

### Step 3: Create the Environment File

```bash
cp .env.example .env.local
```

> **Important:** The file must be named `.env.local`, not `.env`. Next.js loads `.env.local` for local development and `.env.local` is gitignored by default. Never commit this file.

### Step 4: Fill in Environment Variables

Open `.env.local` in your editor and fill in each variable. See the [Environment Variables](#environment-variables) section below for detailed descriptions of every variable.

At minimum, you need these four to get the dashboard running:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
ANTHROPIC_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIza...
```

### Step 5: Start the Development Server

```bash
npm run dev
```

The development server starts on **http://localhost:3000** using the Turbopack bundler (default in Next.js 16). You should see output similar to:

```
   ▲ Next.js 16.2.2 (Turbopack)
   - Local:        http://localhost:3000
   - Network:      http://192.168.x.x:3000
   - Environments: .env.local

 ✓ Ready in 1.2s
```

### Step 6: Verify the Setup

1. Open **http://localhost:3000** in your browser.
2. You should see the login page (if auth is configured) or the dashboard homepage.
3. If you see a blank page or errors, check the terminal output and the [Common Issues](#common-issues-and-troubleshooting) section.

---

## Environment Variables

Every environment variable used by the application, with descriptions, formats, and defaults.

### Supabase (Required)

| Variable | Server/Client | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client (public) | Your Supabase project URL. Format: `https://xxxxx.supabase.co`. Found in Supabase Dashboard > Settings > API > Project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client (public) | Supabase anonymous (public) key. This key is safe to expose in the browser because Row-Level Security (RLS) policies protect all data. Found in Supabase Dashboard > Settings > API > Project API Keys > `anon` `public`. |

> **Why are these `NEXT_PUBLIC_`?** Next.js only exposes environment variables prefixed with `NEXT_PUBLIC_` to the browser. The Supabase client runs in the browser for auth and data fetching. The anon key is safe to expose because RLS policies enforce access control at the database level.

### AI Services (Required)

| Variable | Server/Client | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Server only | Anthropic API key for Claude Sonnet 4. Format: `sk-ant-api03-...`. Used for chat responses, email drafts, meeting prep, and coaching insights. **Never prefix with `NEXT_PUBLIC_`** -- this key must stay server-side. |
| `GEMINI_API_KEY` | Server only | Google Gemini API key for embedding generation. Format: `AIza...`. Used to embed user queries for RAG vector search. Must match the embedding model used by the n8n pipeline (`gemini-embedding-001`). **Never prefix with `NEXT_PUBLIC_`**. |

### Slack Integration (Optional)

| Variable | Server/Client | Description |
|---|---|---|
| `SLACK_WEBHOOK_URL` | Server only | Slack incoming webhook URL for sending meeting summaries. Format: `https://hooks.slack.com/services/T.../B.../xxx`. Create one in Slack > Apps > Incoming Webhooks. If not set, the "Share to Slack" feature is hidden. |
| `SLACK_BOT_TOKEN` | Server only | Slack bot OAuth token. Format: `xoxb-...`. Required scopes: `channels:read` (to list channels in the channel picker). Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps), add the `channels:read` scope, install to workspace, and copy the Bot User OAuth Token. If not set, the channel picker falls back to the allowed channels list. |
| `SLACK_ALLOWED_CHANNELS` | Server only | Comma-separated list of Slack channel names that users can post to. Default: `general,meeting-intel,fullfunnel`. Used as a fallback when `SLACK_BOT_TOKEN` is not configured or when you want to restrict posting to specific channels regardless of bot permissions. |

### Rate Limiting (Optional)

| Variable | Server/Client | Default | Description |
|---|---|---|---|
| `DAILY_QUERY_LIMIT` | Server only | `50` | Maximum number of "Ask Blarney" queries a single user can make per calendar day (UTC). Prevents runaway API costs. Set to `0` for unlimited (not recommended in production). |
| `BURST_QUERY_LIMIT` | Server only | `10` | Maximum number of queries a single user can make within a rolling 5-minute window. Prevents rapid-fire abuse. Set to `0` for unlimited. |

### Pipeline Configuration (Optional)

| Variable | Server/Client | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS` | Client (public) | `8` | Expected interval (in hours) between n8n pipeline runs. Used by the dashboard to display pipeline health status (e.g., "Last sync: 3 hours ago" vs. "Pipeline may be stalled"). This is informational only -- it does not control the actual pipeline schedule. |

### Complete `.env.local` Template

```env
# =============================================================================
# SUPABASE (Required)
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# =============================================================================
# AI SERVICES (Required)
# =============================================================================
ANTHROPIC_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIza...

# =============================================================================
# SLACK INTEGRATION (Optional)
# =============================================================================
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../xxx
# SLACK_BOT_TOKEN=xoxb-...
# SLACK_ALLOWED_CHANNELS=general,meeting-intel,fullfunnel

# =============================================================================
# RATE LIMITING (Optional -- defaults shown)
# =============================================================================
# DAILY_QUERY_LIMIT=50
# BURST_QUERY_LIMIT=10

# =============================================================================
# PIPELINE (Optional -- defaults shown)
# =============================================================================
# NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS=8
```

---

## Supabase Configuration

### Enabling pgvector

The pgvector extension must be enabled in your Supabase project before the n8n pipeline can store embeddings.

1. Go to **Supabase Dashboard > Database > Extensions**.
2. Search for `vector`.
3. Click **Enable** on the `vector` extension.

Alternatively, run this SQL in the Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Tables: n8n Pipeline vs. Dashboard

The database schema is split between tables created by the **n8n pipeline** (which ingests meetings) and tables created by the **dashboard** (for app-specific features).

#### Tables Created by the n8n Pipeline

These tables are populated automatically when the n8n pipeline processes new meetings. You do not need to create them manually -- the pipeline handles schema creation on first run.

| Table | Description |
|---|---|
| `meetings` | Core meeting records: title, date, duration, attendees, raw summary, meeting type |
| `meeting_chunks` | Chunked transcript segments with `embedding` column (vector type). Each meeting produces 5-20 chunks depending on length. |
| `meeting_topics` | Topics extracted from each meeting (e.g., "Pipeline Review", "Q2 Planning") |
| `meeting_action_items` | Action items with assignee, due date, status, and priority |
| `meeting_coaching` | Per-meeting coaching data: talk ratios, question frequency, filler words, engagement |
| `meeting_analytics` | Aggregated analytics: sentiment scores, engagement trends, participant stats |

#### Tables Created by the Dashboard (via Migrations)

These tables support dashboard-specific functionality and are created by Supabase migrations included in the repository.

| Table | Description |
|---|---|
| `profiles` | User profiles linked to Supabase Auth (display name, role, preferences) |
| `user_queries` | Log of "Ask Blarney" queries per user, used for rate limiting and analytics |

To apply dashboard migrations, run:

```bash
npx supabase db push
```

Or apply them manually via the Supabase SQL Editor using the migration files in `supabase/migrations/`.

### Row-Level Security (RLS)

All tables have RLS enabled. Key policies:

- **Authenticated users** can read all meeting data (meetings are shared within the organization).
- **Users can only read/write their own profile** in the `profiles` table.
- **User queries** are scoped to the authenticated user (users cannot see others' query history).

RLS policies are defined in the migration files. If you are setting up a new Supabase project, ensure you apply all migrations before testing.

---

## npm Scripts

All available scripts defined in `package.json`:

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start the development server with Turbopack on port 3000. Hot module replacement is enabled. |
| `build` | `npm run build` | Create a production build. Runs TypeScript type checking and Next.js build. Output goes to `.next/`. |
| `start` | `npm run start` | Start the production server (requires `npm run build` first). |
| `lint` | `npm run lint` | Run ESLint with Next.js rules. Checks `src/` directory. |
| `test` | `npm run test` | Run Vitest in single-run mode. Exits after all tests pass/fail. |
| `test:watch` | `npm run test:watch` | Run Vitest in watch mode. Re-runs affected tests on file changes. |
| `test:coverage` | `npm run test:coverage` | Run Vitest with coverage reporting. Outputs to `coverage/` directory. |
| `test:ui` | `npm run test:ui` | Open the Vitest UI in the browser for interactive test exploration. |
| `test:e2e` | `npm run test:e2e` | Run Playwright end-to-end tests. Requires `npx playwright install` on first run. |

### Recommended Development Workflow

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Tests in watch mode
npm run test:watch

# Before committing
npm run lint && npm run test && npm run build
```

---

## Vercel Deployment

### Step 1: Connect GitHub Repository

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New Project**.
3. Import the GitHub repository.
4. Vercel auto-detects the Next.js framework. Accept the default settings.

### Step 2: Set Environment Variables

1. In the Vercel project, go to **Settings > Environment Variables**.
2. Add each environment variable from the [Environment Variables](#environment-variables) section.
3. For each variable, select which environments it applies to:

| Variable | Production | Preview | Development |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Yes |
| `ANTHROPIC_API_KEY` | Yes | Yes | No (use local) |
| `GEMINI_API_KEY` | Yes | Yes | No (use local) |
| `SLACK_WEBHOOK_URL` | Yes | No | No |
| `SLACK_BOT_TOKEN` | Yes | No | No |
| `SLACK_ALLOWED_CHANNELS` | Yes | Yes | No |
| `DAILY_QUERY_LIMIT` | Yes | Yes | No |
| `BURST_QUERY_LIMIT` | Yes | Yes | No |
| `NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS` | Yes | Yes | No |

> **Important:** By default, Vercel applies environment variables to **Production only**. If you want preview deployments (from pull requests) to work correctly, you must also add variables to the **Preview** environment. Do this for at minimum `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, and `GEMINI_API_KEY`.

### Step 3: Deploy

1. Click **Deploy**. Vercel runs `npm run build` and deploys the output.
2. The first deploy takes 60-90 seconds.
3. Subsequent deploys are faster due to build caching.

### Step 4: Verify

1. Visit the deployment URL (e.g., `https://your-project.vercel.app`).
2. Confirm the login page loads.
3. Log in and verify meeting data appears (assumes the n8n pipeline has populated the database).

### Auto-Deploy Workflow

Once connected, Vercel automatically deploys:

- **Push to `main`** -- triggers a production deployment.
- **Pull request** -- triggers a preview deployment with a unique URL (e.g., `https://your-project-git-branch-name.vercel.app`).

No CI/CD configuration files are needed. Vercel handles everything via the GitHub integration.

### Custom Domain (Optional)

1. Go to **Settings > Domains** in the Vercel project.
2. Add your custom domain (e.g., `meetings.fullfunnel.io`).
3. Follow the DNS configuration instructions (either CNAME or A record).
4. SSL is provisioned automatically.

---

## Common Issues and Troubleshooting

### "Failed to load meeting" or blank meeting page

**Cause:** The Supabase client cannot connect to the database.

**Fix:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct. It should be `https://xxxxx.supabase.co` (no trailing slash).
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the `anon` `public` key (not the `service_role` key).
3. Check that the meeting exists in the `meetings` table in Supabase.
4. Check browser DevTools > Network tab for 401 or 403 errors (indicates RLS policy issues).

### "No response from AI" or chat returns nothing

**Cause:** The Anthropic or Gemini API key is missing, invalid, or rate-limited.

**Fix:**
1. Check that `ANTHROPIC_API_KEY` is set in `.env.local` (for local dev) or Vercel environment variables (for production).
2. Check that `GEMINI_API_KEY` is set.
3. Verify the keys are valid by testing directly:
   ```bash
   # Test Anthropic key
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-sonnet-4-20250514","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'

   # Test Gemini key
   curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=$GEMINI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"models/gemini-embedding-001","content":{"parts":[{"text":"test"}]}}'
   ```
4. Check server logs (terminal for local dev, Vercel > Deployments > Functions for production) for specific error messages.

### Hydration errors in development

**Cause:** React Server Components and client components can produce hydration mismatches during hot reload, especially when browser extensions inject DOM elements.

**Fix:**
1. Hard refresh the page: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux).
2. If the error persists after a hard refresh, it may be a real bug -- check the component for conditional rendering that differs between server and client (e.g., `typeof window !== 'undefined'` checks).
3. Disable browser extensions (especially ad blockers and Grammarly) to rule out DOM injection.

### Slack channel fetch fails

**Cause:** The Slack bot token is missing or does not have the required scopes.

**Fix:**
1. Verify `SLACK_BOT_TOKEN` is set and starts with `xoxb-`.
2. In [api.slack.com/apps](https://api.slack.com/apps), go to your app > OAuth & Permissions > Scopes.
3. Ensure the bot has the `channels:read` scope.
4. Reinstall the app to the workspace after adding scopes (Slack requires reinstallation when scopes change).
5. If you do not need the channel picker, remove `SLACK_BOT_TOKEN` -- the app falls back to `SLACK_ALLOWED_CHANNELS`.

### Rate limit 429 errors on "Ask Blarney"

**Cause:** The user has exceeded the daily or burst query limit.

**Fix:**
1. Check the current limits: `DAILY_QUERY_LIMIT` (default: 50 per day) and `BURST_QUERY_LIMIT` (default: 10 per 5 minutes).
2. To increase limits, update the environment variables and redeploy.
3. To check a specific user's usage, query the `user_queries` table:
   ```sql
   SELECT COUNT(*) 
   FROM user_queries 
   WHERE user_id = '<user-uuid>' 
     AND created_at > NOW() - INTERVAL '1 day';
   ```
4. Rate limit resets daily at midnight UTC.

### Build fails on Vercel

**Cause:** TypeScript errors, missing environment variables, or dependency issues.

**Fix:**
1. Run `npm run build` locally first to catch TypeScript errors.
2. Check that all required environment variables are set in Vercel (especially `NEXT_PUBLIC_` variables, which are inlined at build time).
3. Check the Vercel build log for specific error messages.
4. If the error mentions `Cannot find module`, try deleting `node_modules` and `package-lock.json`, then `npm install` and `npm run build` again.

### Meeting data is stale or missing

**Cause:** The n8n pipeline has not run recently or encountered an error.

**Fix:**
1. Check the pipeline health indicator on the dashboard (uses `NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS` to determine if the pipeline is stalled).
2. Check the n8n workflow execution history for errors.
3. Verify the Supabase connection in the n8n workflow is still valid (Supabase API keys expire if rotated).
4. Manually trigger the n8n workflow to test.

### "Module not found" after pulling new code

**Cause:** New dependencies were added that are not in your local `node_modules`.

**Fix:**
```bash
npm install
```

Always run `npm install` after pulling changes that modify `package.json`.

### Port 3000 already in use

**Cause:** Another process is using port 3000.

**Fix:**
```bash
# Find the process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

---

## Security Notes

1. **Never commit `.env.local`** -- it is gitignored by default. If you see it in `git status`, do not stage it.
2. **Server-side API keys** (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `SLACK_BOT_TOKEN`, `SLACK_WEBHOOK_URL`) must **never** be prefixed with `NEXT_PUBLIC_`. Doing so exposes them to the browser.
3. **Supabase anon key** is safe to expose because RLS policies enforce access control. However, never expose the `service_role` key.
4. **Rate limiting** is enforced server-side per authenticated user. Unauthenticated requests to AI endpoints are rejected.
5. **Vercel environment variables** are encrypted at rest and in transit. They are injected into the build process (for `NEXT_PUBLIC_` vars) or into serverless function environment (for server-only vars).

---

## Quick Reference

```
# Clone and setup
git clone <repo-url> && cd meeting-intelligence-dashboard
npm install
cp .env.example .env.local
# Edit .env.local with your keys

# Development
npm run dev              # Start dev server (port 3000)
npm run test:watch       # Tests in watch mode
npm run lint             # Lint check

# Production build
npm run build            # Type check + build
npm run start            # Serve production build

# Testing
npm run test             # Run all tests once
npm run test:coverage    # Tests with coverage report
npm run test:ui          # Interactive test UI
npm run test:e2e         # Playwright E2E tests

# Deploy
git push origin main     # Auto-deploys to Vercel
```
