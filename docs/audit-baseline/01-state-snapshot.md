# 01 - State Snapshot

**Baseline commit:** `1dc637f` (2026-04-07)
**V1.3 base commit:** `3a37572` (2026-04-04)
**Last updated:** 2026-04-07

## Purpose

This document is the delta between the V1.3 project documentation (in `docs/00-README.md` through `docs/12-project-origin.md`, last updated 2026-04-04) and the current state of the codebase as of `1dc637f`.

It uses `git log` as the primary source of truth. Any future Claude session can run `git show <hash>` to see the exact diff for any commit referenced here.

## How to Regenerate This Doc

```bash
git log --pretty=format:'%h | %ad | %s' --date=short 3a37572..HEAD
```

For full commit messages including the body:

```bash
git log --pretty=format:'%n=== %h | %ad ===%n%s%n%n%b' --date=short 3a37572..HEAD
```

---

## Summary Table - 10 Commits Since V1.3

| Commit | Date | Title |
|--------|------|-------|
| `1dc637f` | 2026-04-07 | fix: transcript actions + Slack full content + recording banner theme |
| `943900d` | 2026-04-07 | feat: Vercel Analytics + Zoom recording thumbnail |
| `604f958` | 2026-04-05 | feat: Reps index page + coaching modal + internal insights |
| `4527c3e` | 2026-04-05 | chore: gitignore test-results directory |
| `48d9b66` | 2026-04-05 | fix: remove all em dashes, fix numbered list rendering, coaching meeting links |
| `d964aea` | 2026-04-05 | feat: coaching insights on rep profile - collapsible, read-only from scored_meetings |
| `0745610` | 2026-04-05 | feat: rep profile upgrade - tinted KPIs, filters, Ask Blarney CTA |
| `9b61d23` | 2026-04-05 | polish: UI/UX audit fixes - error messages, responsive, terminology, accessibility |
| `2a5e449` | 2026-04-05 | fix: Ask Blarney table rendering, scroll, chat persistence + Zoom banner |
| `9851bc3` | 2026-04-04 | feat: scorecard redesign - status-tinted KPIs, weekly briefing, smart alert strip |

(Note: `d82f7d9` on 2026-04-04 was the V1.3 docs commit itself, not a feature change.)

---

## Detailed Commits (Newest First)

### `1dc637f` - 2026-04-07 - Transcript actions + Slack + theme

- Added Copy/Download/Slack buttons to transcript section header
- Toast feedback via sonner for copy and download actions
- Removed transcript truncation - sends full content to Slack
- Slack API now splits long messages into multiple Block Kit sections (2800 chars each)
- Recording banner border adapts to light/dark theme (`shadow-sm` in light mode)

**Files touched:**
- `src/components/meetings/transcript-viewer.tsx`
- `src/app/api/notifications/slack/route.ts`
- `src/app/meetings/[id]/page.tsx`

**Why it matters:** First holistic implementation of "send anywhere" for transcripts. The Slack multi-block split is a pattern we may need elsewhere.

---

### `943900d` - 2026-04-07 - Vercel Analytics + thumbnail

- Installed `@vercel/analytics`, added `<Analytics />` to root layout
- Recording banner now has video-player thumbnail (dark frame, play button, duration badge)
- `BLOB_READ_WRITE_TOKEN` added to `.env.local` for future media storage

**Files touched:**
- `package.json` (added `@vercel/analytics`)
- `src/app/layout.tsx`
- `src/app/meetings/[id]/page.tsx`
- `.env.local`

**Why it matters:** Analytics is now wired in - any future Claude session should be aware. Blob token exists but `@vercel/blob` package is NOT YET INSTALLED in `package.json`. The token is just sitting there waiting for first use.

---

### `604f958` - 2026-04-05 - Reps index page + coaching modal + internal insights

- New `/reps` page with table (default) and card view toggle
- Table columns: name, meetings, avg score, vs team, health, last meeting
- "Reps" added to sidebar nav under Analysis
- Coaching "View all" modal - click insight count to see all with meeting links
- "Summarize patterns with Ask Blarney" button in modal
- Internal Meeting Insights for internal-focused reps (action items, decisions, client refs)
- New API: `/api/reps/[name]/internal-insights` (READ-ONLY from `scored_meetings`)
- Rep profile back link: "Back to scorecard" -> "Back to reps"

**Files added:**
- `src/app/reps/page.tsx`
- `src/app/api/reps/[name]/internal-insights/route.ts`
- `src/lib/hooks/use-rep-internal-insights.ts`
- `src/components/reps/internal-insights-summary.tsx`

**Why it matters:** A NEW route (`/reps`) and a NEW API endpoint (`/api/reps/[name]/internal-insights`) exist that aren't documented in `docs/06-api-reference.md` yet. Documentation drift.

---

### `4527c3e` - 2026-04-05 - chore: gitignore test-results

- Added `test-results/` directory to `.gitignore`

**Why it matters:** Just hygiene. Playwright was creating untracked files.

---

### `48d9b66` - 2026-04-05 - Em dash removal + numbered list fix

- Replaced em dashes with hyphens in 20+ user-visible strings
- Added "NEVER use em dashes" instruction to AI system prompt
- New `cleanText()` display transform for JSONB coaching data (NEVER modifies DB)
- Fixed `isNumberedList()` to detect inline numbering without newlines
- Coaching insights now link to source meeting (API returns `meetingId` + `topic`)
- Updated `format.ts` null fallbacks from "—" to "-"
- Updated all tests to match new format

**Why it matters:** The `cleanText()` pattern is now established for any display-layer transforms on JSONB data we don't control. Don't modify Supabase data, just clean it at render time.

---

### `d964aea` - 2026-04-05 - Coaching insights API

- New API route `/api/reps/[name]/coaching` (READ-ONLY SELECT from `scored_meetings`)
- Extracts `rep_score` JSONB: strengths, improvements, blind spots, recommendations, deal progression
- Collapsed by default: shows Strengths + Improvements (1 truncated insight each)
- "Show more" expands to all 5 categories with up to 3 insights each
- Color-coded cards with left accent borders matching category severity
- `useRepCoaching` hook with 5-min React Query cache

**Files added:**
- `src/app/api/reps/[name]/coaching/route.ts`
- `src/lib/hooks/use-rep-coaching.ts`
- `src/components/reps/coaching-summary.tsx`

**Why it matters:** Another new API endpoint not in the API reference doc.

---

### `0745610` - 2026-04-05 - Rep profile upgrade

- Tinted KPI cards with colored top accents + score bars + "/ 10" labels
- Added stage filter + sort (date/score) to meetings section
- Showed all meetings (removed `slice(0,10)` limit) with count
- "Ask Blarney" button in header for quick coaching AI query
- "View all in Meeting Feed" link -> `/meetings?rep=RepName`
- Larger charts (trend 200px, donut 120px)
- Empty filter state message

**Files touched:** `src/app/reps/[name]/page.tsx` (major rewrite)

---

### `9b61d23` - 2026-04-05 - UI/UX audit fixes (LARGE commit, ~17 changes)

- Replaced dev error messages (API key names) with user-friendly text
- Fixed "Back to companies" link on company detail page
- Showed chat errors as red banner with icon, not AI chat bubbles
- Added sign-out confirmation dialog
- Renamed nav "System" -> "System Health"
- Added score scale labels (`/ 10`) with tooltip on scorecard KPIs
- Showed "Showing X of Y" when filters active on meetings + companies
- Improved Ask Blarney placeholder text with specific examples
- Meeting detail sidebar stacks on mobile (`flex-col lg:flex-row`)
- Companies filter bar wraps on mobile (`flex-col sm:flex-row`)
- Intelligence tab labels icon-only on mobile (`hidden sm:inline`)
- Responsive donut chart sizing (120px mobile, 160px desktop)
- Post-login redirect preserves intended URL (`?redirect=/path`)
- Login placeholder contrast improved (`white/50`), password toggle accessible
- Code blocks use theme-aware `bg-zinc-900` instead of hardcoded `#0A0A0A`
- Intelligence sidebar shows empty state instead of blank
- Fixed duplicate key error on source citations

**Why it matters:** This is a HUGE commit with many small changes. If you bisect any bug, this commit is a likely suspect. Multiple files touched.

---

### `2a5e449` - 2026-04-05 - Ask Blarney table fixes + Zoom banner intro

- Added `remark-gfm` plugin so ReactMarkdown renders pipe tables as HTML tables
- Added `fixSingleLineTables()` fallback for single-line table output from Claude
- Ensured fenced code blocks (\`\`\`chart/sources/followups) start on own line
- Showed "Generating chart..." placeholder during streaming instead of error flash
- Replaced ScrollArea with plain div for working auto-scroll-to-bottom
- Fixed double scrollbar with responsive height calc (md breakpoint)
- Smart `initialQuery` dedup - restore from localStorage on browser back
- Changed RAG score context from pipe-separated to dash-separated format
- Added Zoom recording banner on meeting detail page (FIRST appearance of banner)
- Added cursor fix on bar chart tooltip hover

**Why it matters:** This is when the Zoom recording banner was introduced. Also the start of the markdown table rendering pattern in chat.

---

### `9851bc3` - 2026-04-04 - Scorecard redesign (post-V1.3 docs)

**KPI Cards:**
- Colored top accents based on metric status (blue/green/amber/red)
- Week-over-week deltas on ALL 4 cards (was only Avg Score)
- Score progress bars under Avg Score and Avg Health
- Pulsing red dot on At-Risk when count > 0
- "All healthy" green text when no at-risk accounts
- Tighter padding, uppercase tracking labels

**Weekly Briefing (replaces Cross-Call Insights):**
- Narrative paragraph generated client-side from meeting data
- Covers: score trend, top performer, at-risk accounts, rep movements
- "Ask Blarney for more" link for deeper exploration

**Smart Alerts Strip:**
- Horizontal scrollable pill badges replacing 3 large colored blocks
- Only shows changes (rep score drops/rises, at-risk, new meetings)
- Each alert is clickable - links to rep profile or company detail
- Saves ~80px vertical space vs old insights section

**Why it matters:** This commit happened ON THE SAME DAY as the V1.3 docs but AFTER them. The docs describe the OLD scorecard. The current scorecard is documented in this commit, not in `docs/04-features.md`.

---

## Phase 0 - Uncommitted Work (Working Tree)

As of `1dc637f`, the working tree has **2 uncommitted modified files** that represent the recharts visualization work from the most recent session:

### `src/components/scorecard/competitor-mentions.tsx`

**What changed:** Replaced the text card grid of vendor mentions with a horizontal `BarChart` from Recharts.
- Imports: `BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell` from recharts
- New state: `selectedVendor` (click-to-expand pattern)
- Bar fill uses HSL gradient (`hsl(217, 91%, ${40 + index * 5}%)`) for visual hierarchy
- Click handler toggles `selectedVendor`, expanding meeting details below the chart
- Wrapped in `ChartDownload` for PNG export
- Theme fix: removed `stroke="hsl(var(--muted-foreground))"` from axes - was making labels invisible in light mode (SVG text uses `fill`, not `stroke`)
- Selected bar darkens to `#0B4BC2`, others fade to `0.3` opacity

### `src/components/companies/intelligence-sidebar/meddic-section.tsx`

**What changed:** Added a `RadarChart` above the existing MEDDIC text list.
- Imports: `RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip` from recharts
- Custom `MeddicTooltip` component shows dimension name + status (Known/Partial/Missing)
- Status conversion: `known=100, partial=50, missing=0`
- Short labels for narrow sidebar: "Economic Buyer" -> "Econ. Buyer", etc.
- Empty state: shows "No MEDDIC data discovered yet" if all 6 dimensions missing
- Theme fix: same as competitor-mentions - removed explicit `fill` from `tick` prop

**Status:** Done, tested locally, TypeScript clean, all 77 tests pass. NOT YET COMMITTED. To be reviewed and committed as part of executing the audit plan.

---

## New Routes / APIs Added Since V1.3

| Route | Type | Commit | Documented in `docs/06-api-reference.md`? |
|-------|------|--------|--------------------------------------------|
| `/reps` | Page | `604f958` | NO (new) |
| `/api/reps/[name]/coaching` | API | `d964aea` | NO (new) |
| `/api/reps/[name]/internal-insights` | API | `604f958` | NO (new) |

**Note:** The existing `docs/06-api-reference.md` says there are 9 API routes. The actual count is now **11** (the original 9 plus the 2 new rep APIs).

---

## New Packages Added Since V1.3

| Package | Version | Commit | Why |
|---------|---------|--------|-----|
| `@vercel/analytics` | `^2.0.1` | `943900d` | Page view tracking via `<Analytics />` in root layout |

**Important:** `BLOB_READ_WRITE_TOKEN` was added as an env var in `943900d`, but `@vercel/blob` package is **NOT YET INSTALLED**. The token is configured for future use.

---

## Discrepancies Between Project Docs and Current Reality

These are documentation drift items that the V1.4 update to `docs/09-version-history.md` will partially address. Full doc sync should happen at the next checkpoint.

### Discrepancy 1: `.env.example` is incomplete

Current `.env.example` (6 lines):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
SLACK_WEBHOOK_URL=
NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS=8
```

**Missing env vars that the code actually uses:**
- `SLACK_BOT_TOKEN` (used in `api/slack/channels/route.ts` and `api/notifications/slack/route.ts`)
- `BLOB_READ_WRITE_TOKEN` (added in `943900d` for future blob storage)
- `DAILY_QUERY_LIMIT` (rate limit override, default 50)
- `BURST_QUERY_LIMIT` (rate limit override, default 10)
- `SLACK_ALLOWED_CHANNELS` (channel allowlist for Slack picker)

**Impact:** Anyone setting up the project from scratch will be confused.

### Discrepancy 2: `next.config.ts` is empty

Current content:
```typescript
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

**Impact:** No security headers configured. This is finding F02 in `02-checkpoint-findings.md`.

### Discrepancy 3: `docs/09-version-history.md` stops at V1.3

The file ends at V1.3 / commit `3a37572`. There are 10 commits between that and `1dc637f` that aren't documented.

**Plan:** Append a V1.4 entry to `docs/09-version-history.md` as part of executing this audit. (See execution plan.)

### Discrepancy 4: Test count baseline

`docs/08-testing.md` says 77 tests across 13 files. **Still accurate.** No new tests have been added since V1.3 even though new code has been written. This is finding F05.

### Discrepancy 5: Scorecard description in `docs/04-features.md`

The features doc describes the OLD scorecard (3 large colored insight blocks, original KPI cards). The CURRENT scorecard has tinted KPIs, weekly briefing narrative, smart alert pills (per commit `9851bc3`).

**Impact:** Anyone reading features doc will see a different UI than what's deployed.

### Discrepancy 6: API count

`docs/00-README.md` says "9 API routes" and `docs/06-api-reference.md` documents 9. The actual count is **11** (added: `/api/reps/[name]/coaching` and `/api/reps/[name]/internal-insights`).

---

## Test Count History

| Date | Commit | Test Files | Tests | Source |
|------|--------|------------|-------|--------|
| 2026-04-04 | `e1f25ee` | 13 | 77 | V1.0 stabilization |
| 2026-04-04 | `b176563` | 13 | 77 | V1.3 release |
| 2026-04-07 | `1dc637f` | 13 | 77 | Current baseline (no new tests) |

**Conclusion:** Test count has been flat since V1.0 stabilization. New code added in V1.3 -> V1.4 has not been accompanied by new tests. This is a real and growing gap (finding F05).

---

## Quick State Check Commands

Run these at the start of any session to verify reality matches this snapshot:

```bash
# Latest commit
git log -1 --format='%h | %ad | %s' --date=short

# Uncommitted changes (should match Phase 0 above unless work has progressed)
git status --short

# Test count
npx vitest run 2>&1 | grep -E "Test Files|Tests"

# TypeScript health
npx tsc --noEmit && echo "TS clean"

# Routes verified
ls src/app/reps/page.tsx 2>/dev/null && echo "Reps index exists"
ls src/app/api/reps/coaching/route.ts 2>/dev/null || ls "src/app/api/reps/[name]/coaching/route.ts" 2>/dev/null && echo "Coaching API exists"
```
