# Project Origin: How the Meeting Intelligence Dashboard Was Built

This document captures the history, decisions, and lessons from building the Meeting Intelligence Dashboard. It exists so that future engineers understand not just what was built, but why it was built this way.

---

## The Beginning

**Project initiated by:** Neeraj Kumar, Director GTM Engineering at FullFunnel

**Original brief:** `knowledge_base/claude_code_dashboard_prompt.md` (in the parent Meeting Intelligence directory)

**The problem:** FullFunnel had a production-stable Meeting Intelligence Engine running on n8n -- 6 workflows that capture Zoom meetings, transcribe them, and score them using a 4-LLM pipeline. The scored data lived in Supabase, but the only way to access it was direct SQL queries. Leadership needed a way to see scores, coaching insights, and trends without touching a database.

**The goal:** Build a frontend dashboard on top of the existing n8n + Supabase backend. The backend was not to be modified -- the dashboard is a read-only consumer of n8n's data, with its own tables only for dashboard-specific features (notes, analytics).

---

## Original Plan vs. What Was Built

| Aspect | Planned | Actually Built | Why It Changed |
|--------|---------|---------------|----------------|
| Pages | 7 (Scorecard, Meetings, Detail, Companies, AI Search, Health, Login) | 10 (added Rep Profile, Meeting Print, Company Detail) | Reps needed their own view; print layout needed for meeting prep handouts; companies needed drill-down |
| Chart library | Tremor | Recharts | Tremor had CSS conflicts with shadcn/ui in the App Router context |
| Authentication | Vercel password protection | Supabase Auth (email/password) | Vercel protection is one shared password; Supabase Auth gives per-user accounts for analytics |
| Date filtering | Basic date range | Multi-filter (rep, stage, company, custom dates) | Single filter was not enough for leadership's questions |
| Slack integration | Simple webhook | Bot token + channel picker + allowlist | Webhook can only post to one channel; bot token enables user-selected channels |
| RAG chat | Basic question-answer | Charts, sources, follow-ups, analytics, rate limiting, thumbs feedback | Every demo surfaced a new "what if" requirement |

---

## Key Architectural Decisions

### 1. Recharts Over Tremor

Tremor was the original plan because it has pre-built dashboard components. In practice, Tremor's CSS conflicted with shadcn/ui when both ran inside Next.js App Router. Recharts worked seamlessly with TypeScript generics in React 19 and gave full control over styling.

### 2. Supabase Auth Over Vercel Password Protection

Vercel's built-in password protection gives everyone the same password. That means no way to track which user is asking questions, no per-user rate limiting, and no audit trail. Supabase Auth provides individual accounts, which the dashboard uses for analytics tracking, rate limiting, and meeting notes attribution.

### 3. meetings_list View for List Pages

The original plan queried `scored_meetings` directly. That table has 23K+ characters of transcript per row plus the full JSONB scores blob. Loading 76 meetings with all that data was slow and unnecessary for a list view. The `meetings_list` view strips heavy columns and exposes only what the list pages need.

### 4. Fire-and-Forget Analytics

Rather than building a separate analytics service or using a third-party tool, the dashboard writes analytics events (chat queries, feedback, page views) directly to Supabase using a silent INSERT pattern. If the insert fails, the user's action still succeeds. This is intentional -- analytics should never block the user experience.

### 5. Section-Level Meeting Notes

Notes could have been attached at the meeting level (one note per meeting). Instead, they are section-level: a note on the Coaching tab, another on the Deal Intelligence tab. This means a user can write "this coaching score seems wrong because the rep was actually doing X" right next to the score it refers to.

### 6. n8n Table Boundary

Hard rule: the dashboard never writes to tables that n8n owns (`scored_meetings`, `meeting_chunks`, `scoring_run_log`, `zoom_users`). The dashboard only reads from them. Dashboard-owned tables (`chat_analytics`, `meeting_notes`) are separate. This boundary prevented multiple potential incidents during development where a write operation could have corrupted pipeline data.

---

## Evolution

### V1.0 -- Core Dashboard
- 7 page routes (scorecard, meetings list, meeting detail, companies, AI search, system health, login)
- Basic RAG chat with Claude Sonnet 4
- Supabase Auth with login/logout
- Action buttons (email draft, meeting prep, Slack via webhook)

### V1.1 -- Slack + Intelligence
- Slack Bot Token integration with channel picker and allowlist
- Notification system (toast + Slack send from meeting detail)
- Sync indicator in sidebar (fresh/stale/warning based on pipeline runs)
- Company Intelligence page
- 77 unit/integration tests

### V1.2 -- Visual Polish
- Accent borders and sparklines on KPI cards
- Chart download as PNG (captures HTML titles + SVG chart)
- Filter fixes (multi-select for rep, stage, company)
- Print-optimized meeting detail layout
- Removed orange from all charts (brand feedback)

### V1.3 -- Ask Blarney + Analytics
- Rebranded AI chat from "AI Search" to "Ask Blarney"
- Chat analytics tracking (queries, response times, source counts)
- Rate limiting (daily + burst) with fail-open pattern
- Meeting notes (section-level, per meeting)
- RAG performance improvements (better chunk matching, source citations with real meeting IDs)
- 13-document documentation suite

---

## Learnings

These are not abstract principles. Each one came from a specific incident during development.

### 1. Shared Components Are Fragile
The `BrandTooltip` component was modified to fix a styling issue. That change broke hover data display on every chart in the dashboard -- scorecard, meeting detail, company page. **Rule:** Always grep for all consumers of a shared component before modifying it.

### 2. React 19 Strict Purity
Calling `Date.now()` inside a render function causes React 19 to throw purity errors in development mode. The fix is the `useState` initializer pattern: `const [now] = useState(() => Date.now())`. This bit us on the sync indicator and the rate limiting display.

### 3. Tailwind v4 Class Matching
Using `document.querySelector` with Tailwind class names (e.g., `.text-blue-500`) is unreliable because Tailwind v4 can generate different class strings. Use `data-` attributes or inline styles for any element that needs programmatic access. This affected chart download logic.

### 4. n8n Table Boundary (Repeated for Emphasis)
Never write to tables that n8n owns. This came up at least three times during development when it seemed convenient to "just add a column" to `scored_meetings`. Every time, we chose to create a dashboard-owned table instead. This kept the pipeline and dashboard fully decoupled.

### 5. Fire-and-Forget Is the Right Pattern for Analytics
If the analytics INSERT fails, the user should not see an error. Silent `try/catch` with no re-throw. Multiple times during development, Supabase rate limits or schema changes broke analytics writes. Users never noticed because the pattern absorbed failures silently.

### 6. Rate Limiting Should Be Fail-Open
If the rate limit check itself errors (Supabase down, query timeout), let the user's query through. Better to serve an untracked query than to block a legitimate user because of an infrastructure hiccup.

### 7. localStorage Is Fragile
Conversation history, channel preference, and notification state all live in the browser's localStorage. Different browser = different state. Incognito = no state. This is acceptable for these specific features but would not work for anything mission-critical.

### 8. Chart Downloads Need HTML, Not Just SVG
Recharts renders the chart itself as SVG, but chart titles, legends, and axis labels are HTML elements outside the SVG. The download function must capture the entire container div, not just the `<svg>` element. This required using `html2canvas` on the wrapper rather than SVG serialization.

### 9. Source Citations Need Real Meeting IDs in Context
When building RAG responses, Claude initially used placeholder text like "meeting-uuid" in source citations because the chunk metadata did not include the meeting UUID in a format Claude could reference. The fix was adding a `[uuid]` prefix to the score data passed as context, so Claude could cite real meetings that link to actual detail pages.

### 10. Document as You Go
This documentation suite (13 files) was created at V1.3. It would have been significantly easier if each feature had been documented when it was built. Context decays fast -- by the time you write docs weeks later, you are reconstructing decisions from commit history and code comments.

---

## Team

| Role | Who |
|------|-----|
| Product and Engineering | Neeraj Kumar (FullFunnel) |
| AI Development | Claude Code (Anthropic) |
| Backend (n8n pipelines) | Pre-existing, not modified by this project |

The entire dashboard -- 10 pages, 9 API routes, 77 tests, and this documentation -- was built by Neeraj and Claude Code working together in iterative sessions. The n8n backend was already production-stable before the dashboard project started and was treated as a fixed external dependency throughout.

---

## File References

| Reference | Location |
|-----------|----------|
| Original project brief | `../knowledge_base/claude_code_dashboard_prompt.md` |
| Product plan | `../knowledge_base/meeting_intelligence_dashboard_product_plan.md` |
| RAG implementation guide | `../knowledge_base/rag_implementation_guide 2.md` |
| n8n engine PRD | `../knowledge_base/meeting_intelligence_engine_prd_v3 2.md` |
| n8n engine SOP | `../knowledge_base/meeting_intelligence_engine_sop_v2_1.md` |
| Brand guidelines | `../knowledge_base/FullFunnel_Brand Guidelines (1).pdf` |
