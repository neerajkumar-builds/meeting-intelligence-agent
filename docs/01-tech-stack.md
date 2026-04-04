# Technology Stack

> Meeting Intelligence Dashboard -- FullFunnel Internal Initiative
>
> Last updated: 2026-04-04

---

## Overview

The Meeting Intelligence Dashboard is a full-stack Next.js application that ingests meeting transcripts (via an n8n pipeline), stores them in Supabase with vector embeddings, and surfaces insights through an AI-powered chat interface ("Ask Blarney"), coaching tools, and analytics views.

This document catalogs every technology in the stack, the version pinned in `package.json`, and the rationale behind each choice. It is intended for GTM engineers who need to replicate or extend this architecture for other customers.

---

## Core Framework

| Technology | Version | Role |
|---|---|---|
| **Next.js** | 16.2.2 | Full-stack React framework (App Router) |
| **React** | 19.2.4 | UI library |
| **TypeScript** | strict mode | Type safety across the entire codebase |

### Why Next.js App Router?

- **File-based routing** -- every file in `src/app/` becomes a route, eliminating a separate router config.
- **API routes in the same project** -- server-side logic (Claude calls, Supabase queries, Slack webhooks) lives alongside the UI in `src/app/api/`, reducing deployment complexity to a single Vercel project.
- **React Server Components (RSC)** -- heavy data fetching happens on the server, reducing client bundle size.
- **Turbopack dev server** -- significantly faster hot module replacement during development compared to Webpack. Enabled by default in Next.js 16.
- **Built-in middleware** -- used for auth session refresh and route protection via `middleware.ts`.

### Why TypeScript (strict mode)?

- Catches entire categories of bugs at compile time (null checks, type mismatches, exhaustive switch statements).
- Enables IDE autocompletion for Supabase row types, API response shapes, and component props.
- Strict mode (`"strict": true` in `tsconfig.json`) enforces `noImplicitAny`, `strictNullChecks`, and `strictFunctionTypes` -- preventing the most common runtime errors in a data-heavy dashboard.

---

## Database and Backend Services

| Technology | Version / Plan | Role |
|---|---|---|
| **Supabase** | Cloud (PostgreSQL 15+) | Database, auth, REST API, vector search |
| **pgvector** | Extension | Cosine similarity search on meeting transcript embeddings |

### Why Supabase instead of raw PostgreSQL?

1. **Auth built in** -- email/password authentication with Row-Level Security (RLS) policies, eliminating the need for a separate auth service (Auth0, Clerk, etc.).
2. **Instant REST API** -- every table gets a PostgREST API automatically. The dashboard reads meetings, topics, and analytics through the Supabase JS client without writing raw SQL.
3. **pgvector extension** -- enables vector similarity search directly in PostgreSQL. The n8n pipeline generates embeddings for each meeting chunk and stores them in a `meeting_chunks` table. "Ask Blarney" queries are embedded at request time and matched via cosine similarity.
4. **Realtime subscriptions** -- while not heavily used today, Supabase Realtime is available for future features (live meeting status, collaborative notes).
5. **Single billing entity** -- auth, database, storage, and vector search under one provider simplifies procurement and ops.

### Key Supabase Tables

| Table | Created by | Purpose |
|---|---|---|
| `meetings` | n8n pipeline | Core meeting records (title, date, attendees, summary) |
| `meeting_chunks` | n8n pipeline | Chunked transcript segments with vector embeddings |
| `meeting_topics` | n8n pipeline | Extracted topics per meeting |
| `meeting_action_items` | n8n pipeline | Action items extracted from transcripts |
| `meeting_coaching` | n8n pipeline | Coaching insights (talk ratio, filler words, etc.) |
| `meeting_analytics` | n8n pipeline | Aggregated analytics (sentiment, engagement scores) |
| `user_queries` | Dashboard API | "Ask Blarney" query log for rate limiting |
| `profiles` | Dashboard migration | User profiles linked to Supabase Auth |

---

## AI Services

| Technology | Model | Role |
|---|---|---|
| **Anthropic Claude** | claude-sonnet-4-20250514 (Sonnet 4) | Chat responses, email drafts, meeting prep, coaching |
| **Google Gemini** | gemini-embedding-001 | Query embedding generation for RAG vector search |

### Why Claude Sonnet 4 for generation?

- Best-in-class instruction following for structured outputs (JSON action items, coaching feedback, email drafts).
- Strong performance on meeting transcript analysis -- handles long contexts well.
- The `@anthropic-ai/sdk` npm package provides a clean TypeScript-first API with streaming support.
- Used server-side only (`ANTHROPIC_API_KEY` is never exposed to the browser).

### Why Google Gemini for embeddings?

- `gemini-embedding-001` produces high-quality embeddings optimized for retrieval tasks.
- Cost-effective at scale -- embedding hundreds of meeting chunks per pipeline run.
- The n8n pipeline also uses Gemini for embedding generation, so using the same model at query time ensures vector space consistency (critical for accurate cosine similarity).
- Used server-side only (`GEMINI_API_KEY` is never exposed to the browser).

### RAG Architecture

```
User query
    |
    v
[Gemini embedding] --> cosine similarity search in pgvector
    |
    v
Top-K relevant meeting chunks retrieved
    |
    v
[Claude Sonnet 4] generates response grounded in retrieved chunks
    |
    v
Streamed response to the browser
```

---

## UI Layer

| Technology | Version | Role |
|---|---|---|
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **shadcn/ui** | Latest (Radix primitives) | Accessible, unstyled UI component library |
| **Recharts** | 3.8.1 | Charting library for analytics views |
| **Lucide React** | Latest (40+ icons used) | Icon library |
| **Sonner** | Latest | Toast notification system |
| **cmdk** | Latest | Command palette (Cmd+K) |
| **react-day-picker** | Latest | Date picker component |
| **class-variance-authority** | Latest | Variant-based component styling |
| **clsx** + **tailwind-merge** | Latest | Conditional class name merging |
| **tw-animate-css** | Latest | Tailwind animation utilities |
| **next-themes** | Latest | Dark/light theme toggle |
| **react-markdown** | Latest | Render AI-generated markdown responses |

### Why Tailwind CSS 4?

- **oklch color space** -- Tailwind 4 uses oklch by default, providing perceptually uniform colors. This matters for data visualization where subtle color differences communicate meaning (sentiment scores, engagement levels).
- **Zero-config content detection** -- Tailwind 4 automatically detects template files, eliminating the `content` array in config.
- **CSS-first configuration** -- theme tokens are defined in CSS (`@theme`) rather than JavaScript, making them accessible to both Tailwind utilities and custom CSS.

### Why shadcn/ui instead of a full component library (MUI, Chakra, Ant)?

- **Copy-paste ownership** -- shadcn/ui components are copied into `src/components/ui/` and become first-party code. No version lock-in, no breaking upgrades from a third-party npm package.
- **Radix primitives** -- built on Radix UI, which handles accessibility (keyboard navigation, ARIA attributes, focus management) correctly out of the box.
- **Tailwind-native** -- components use Tailwind classes directly, so customization is just editing class names -- no theme object overrides or CSS-in-JS.
- **Tree-shakeable** -- only the components you import are bundled. The dashboard uses ~20 shadcn components (Button, Card, Dialog, Select, Tabs, etc.) without pulling in an entire design system.

### Why Recharts instead of Tremor?

- The original plan was to use **Tremor** for charts (and `@tremor/react` is still in dependencies as a legacy reference). However:
  - Tremor's React 19 support was incomplete at the time of development.
  - Recharts 3.x had significantly better TypeScript type definitions.
  - Recharts provides lower-level control over chart customization (custom tooltips, responsive containers, animation config) which was needed for the coaching and analytics views.
- **@tremor/react** remains in `dependencies` but is being phased out. New chart work should use Recharts exclusively.

### Why Lucide React?

- Consistent, clean icon set with 1,500+ icons.
- Tree-shakeable -- importing `<Brain />` only bundles that one SVG path.
- The dashboard uses 40+ unique icons across navigation, cards, and status indicators.

---

## Authentication

| Technology | Role |
|---|---|
| **Supabase Auth** | Email/password authentication |
| **@supabase/ssr** | Cookie-based SSR session management |

### Why Supabase Auth with SSR cookies?

- **Integrated with RLS** -- Supabase Row-Level Security policies use the authenticated user's JWT to restrict data access at the database level. No application-level authorization code needed.
- **@supabase/ssr** stores the session in HTTP-only cookies, which works seamlessly with Next.js Server Components and API routes. The alternative (`@supabase/auth-helpers-nextjs`) is deprecated.
- **Middleware-based refresh** -- `middleware.ts` refreshes the session token on every request, preventing stale sessions.

---

## State Management

| Technology | Version | Role |
|---|---|---|
| **TanStack React Query** | 5.96.2 | Server state caching, background refetch, optimistic updates |

### Why TanStack React Query instead of Redux / Zustand / SWR?

- **Purpose-built for server state** -- the dashboard is almost entirely server-driven (meetings, analytics, chat history). React Query manages the fetch-cache-refetch lifecycle without boilerplate reducers.
- **Automatic cache invalidation** -- when a user sends a Blarney query, React Query invalidates the meeting data cache, ensuring fresh data on the next render.
- **Background refetch** -- stale data is silently refreshed in the background, so navigation between meeting views feels instant.
- **Devtools** -- TanStack Query Devtools (included in dev builds) show cache state, making debugging trivial.
- **5.96.2** is the latest stable release with full React 19 compatibility.

---

## Testing

| Technology | Version | Role |
|---|---|---|
| **Vitest** | 4.1.2 | Unit and integration test runner |
| **@testing-library/react** | Latest | Component testing utilities |
| **@testing-library/jest-dom** | Latest | Custom DOM matchers |
| **@testing-library/user-event** | Latest | Simulated user interactions |
| **jsdom** | Latest | Browser environment for Vitest |
| **Playwright** | Latest | End-to-end browser testing |

### Why Vitest instead of Jest?

- **Native ESM support** -- Vitest handles ES modules natively, avoiding the `transformIgnorePatterns` hacks required by Jest for Next.js projects.
- **Vite-powered** -- uses the same Vite transform pipeline as the dev server, so test setup mirrors production behavior.
- **Jest-compatible API** -- `describe`, `it`, `expect`, `vi.fn()` -- minimal learning curve for engineers familiar with Jest.
- **Watch mode with HMR** -- `vitest --watch` re-runs only affected tests on file change, significantly faster than Jest's watcher.

### Why Playwright for E2E?

- **Cross-browser** -- tests run in Chromium, Firefox, and WebKit from the same test file.
- **Auto-waiting** -- Playwright waits for elements to be actionable before interacting, reducing flaky tests.
- **Trace viewer** -- captures screenshots, network requests, and console logs for failed tests, making debugging straightforward.

---

## Deployment

| Technology | Role |
|---|---|
| **Vercel** | Hosting, CI/CD, edge network |
| **GitHub** | Source control, PR-based workflow |

### Why Vercel?

- **Zero-config Next.js deployment** -- Vercel is the creator of Next.js. Build settings, serverless function configuration, and edge middleware work out of the box.
- **Auto-deploy from GitHub** -- every push to `main` triggers a production deployment. Pull requests get preview deployments with unique URLs.
- **Environment variable management** -- secrets (API keys) are configured per-environment (production, preview, development) in the Vercel dashboard.
- **Edge network** -- static assets and ISR pages are served from the nearest edge node, reducing TTFB for geographically distributed teams.

---

## Fonts

| Font | Usage |
|---|---|
| **Montserrat** | Headings and body text |
| **Geist Mono** | Code blocks, monospaced content |

### Why Montserrat?

- Clean, modern sans-serif with excellent readability at dashboard-typical sizes (12-18px).
- Loaded via `next/font/google` for automatic font optimization (subsetting, `font-display: swap`).

### Why Geist Mono?

- Designed by Vercel specifically for developer tools. Pairs well with Montserrat.
- Used in code blocks within AI-generated responses and the command palette.

---

## Date Handling

| Technology | Role |
|---|---|
| **date-fns** | Date formatting, relative time, parsing |

### Why date-fns instead of Moment.js / Day.js?

- **Tree-shakeable** -- import only the functions you use (`format`, `formatDistanceToNow`, `parseISO`). Moment.js bundles everything.
- **Immutable** -- all functions return new Date objects, preventing mutation bugs.
- **No prototype pollution** -- unlike Moment.js, date-fns does not extend the `Date` prototype.

---

## Full Dependency List

### Production Dependencies (22)

| Package | Version | Purpose |
|---|---|---|
| `@anthropic-ai/sdk` | Latest | Claude API client for chat, email drafts, coaching |
| `@base-ui/react` | Latest | Base UI primitives (used by some shadcn components) |
| `@supabase/ssr` | Latest | Cookie-based Supabase session for SSR |
| `@supabase/supabase-js` | Latest | Supabase client (database, auth, storage) |
| `@tanstack/react-query` | 5.96.2 | Server state management, caching, refetch |
| `@tremor/react` | Latest | Legacy chart components (being phased out) |
| `class-variance-authority` | Latest | Variant-based component styling (used by shadcn) |
| `clsx` | Latest | Conditional class name construction |
| `cmdk` | Latest | Command palette (Cmd+K search) |
| `date-fns` | Latest | Date formatting and manipulation |
| `lucide-react` | Latest | Icon library (40+ icons) |
| `next` | 16.2.2 | Full-stack React framework |
| `next-themes` | Latest | Dark/light mode theme provider |
| `react` | 19.2.4 | UI library |
| `react-day-picker` | Latest | Date range picker component |
| `react-dom` | 19.2.4 | React DOM renderer |
| `react-markdown` | Latest | Render markdown from AI responses |
| `recharts` | 3.8.1 | Charts and data visualization |
| `shadcn` | Latest | CLI for adding shadcn/ui components |
| `sonner` | Latest | Toast notifications |
| `tailwind-merge` | Latest | Merge Tailwind classes without conflicts |
| `tw-animate-css` | Latest | Animation utilities for Tailwind |

### Dev Dependencies (16)

| Package | Version | Purpose |
|---|---|---|
| `@playwright/test` | Latest | End-to-end browser testing |
| `@tailwindcss/postcss` | Latest | PostCSS plugin for Tailwind 4 |
| `@testing-library/dom` | Latest | DOM testing utilities |
| `@testing-library/jest-dom` | Latest | Custom DOM assertion matchers |
| `@testing-library/react` | Latest | React component testing utilities |
| `@testing-library/user-event` | Latest | Simulated user interaction events |
| `@vitejs/plugin-react` | Latest | React support for Vitest |
| `eslint` | Latest | JavaScript/TypeScript linter |
| `eslint-config-next` | Latest | Next.js ESLint rules |
| `jsdom` | Latest | Browser environment simulation for tests |
| `tailwindcss` | 4 | Utility-first CSS framework |
| `typescript` | Latest | TypeScript compiler |
| `vitest` | 4.1.2 | Unit/integration test runner |
| `@types/node` | Latest | Node.js type definitions |
| `@types/react` | Latest | React type definitions |
| `@types/react-dom` | Latest | React DOM type definitions |

---

## Architecture Diagram

```
                         +-------------------+
                         |     Vercel        |
                         | (Next.js 16.2.2) |
                         +--------+----------+
                                  |
                    +-------------+-------------+
                    |                           |
            +-------+-------+         +--------+--------+
            |  App Router   |         |   API Routes    |
            |  (React 19)   |         | /api/meetings/* |
            |  shadcn/ui    |         | /api/blarney/*  |
            |  Recharts     |         | /api/slack/*    |
            |  TanStack Q.  |         | /api/analytics/*|
            +-------+-------+         +--------+--------+
                    |                           |
                    |                  +--------+--------+
                    |                  |                 |
                    |          +-------+----+    +------+------+
                    |          |  Anthropic |    |   Google    |
                    |          |  Claude    |    |   Gemini    |
                    |          |  Sonnet 4  |    | Embeddings  |
                    |          +------------+    +------+------+
                    |                                   |
                    +-----------------------------------+
                                  |
                         +--------+--------+
                         |    Supabase     |
                         |  PostgreSQL +   |
                         |   pgvector     |
                         +--------+--------+
                                  |
                         +--------+--------+
                         |   n8n Pipeline  |
                         | (external,      |
                         |  populates DB)  |
                         +-----------------+
```

---

## Version Pinning Policy

- **Major versions** are pinned explicitly (`next@16.2.2`, `react@19.2.4`, `recharts@3.8.1`).
- **Minor/patch versions** use caret ranges (`^`) in `package.json` for automatic security patches.
- **Lock file** (`package-lock.json`) is committed to ensure reproducible builds across environments.
- Before upgrading any major dependency, run the full test suite: `npm run test && npm run build`.
