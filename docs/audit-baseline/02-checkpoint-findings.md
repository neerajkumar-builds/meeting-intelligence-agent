# 02 - Quality Checkpoint Findings

**Baseline commit:** `1dc637f` (2026-04-07)
**Total findings:** 21 (4 Critical, 6 High, 6 Medium, 5 Low)
**Audit method:** 3 parallel Explore agents scanning all pages, all 11 API routes, all components, auth flow, infrastructure
**False positives filtered out:** 2

## How to Use This Document

Findings are organized by **category** first, then **severity** within each category. Each finding has:

- **Severity:** Critical / High / Medium / Low (see triage rules below)
- **Category icon:** for quick scanning
- **Location:** file:line reference
- **Introduced in:** git commit hash where the pattern first appeared (when known)
- **What it is:** brief description
- **How to replicate:** steps to see the issue
- **Repercussion:** what can go wrong if not fixed
- **Example:** concrete example
- **Proposed fix:** recommended approach
- **Risk of fix:** low/medium/high with mitigation
- **References:** related code, findings, docs

## Triage Rules

| Severity | Definition |
|----------|-----------|
| **Critical** | Security vulnerabilities, data corruption, crashes affecting all users |
| **High** | Broken UX for common flows, test gaps in critical paths, blocking issues |
| **Medium** | Theme/polish issues, inconsistencies, single-flow bugs |
| **Low** | Cosmetic, nice-to-have, edge cases |

## Categories

| Icon | Category | Count |
|------|----------|-------|
| Security | Security | 4 |
| Tests | Test Coverage | 1 |
| Logic | Code Quality / Logic | 4 |
| Theme | Theme / Visual | 4 |
| UX | UX / Navigation | 5 |
| Perf | Performance | 2 |
| A11y | Accessibility | 1 |

---

## Findings Filtered Out (False Positives)

These were flagged by audit agents but determined to NOT be real issues:

### NOT-A-FINDING-1: SQL Injection in `.eq()` calls
**Why filtered:** Supabase JavaScript client uses parameterized queries. The `.eq("host_name", repName)` pattern passes the value as a parameter, never concatenating it into SQL. There is no injection risk.
**Reference:** Confirmed via Supabase docs and source code review.

### NOT-A-FINDING-2: `.env.local` committed to git
**Why filtered:** While `.env.local` exists in the project root, the standard Next.js `.gitignore` template excludes it. Need to verify this project's `.gitignore` actually has the entry, but it's not a real "secret in git" risk because the file is local-only.
**Action item:** Verify `.gitignore` contains `.env*.local` (will be in execution plan if not).

---

# CRITICAL FINDINGS (4)

## F01 - No Authentication on API Routes  [Security]

**Severity:** Critical
**Category:** Security
**Location:** `src/middleware.ts:9-18`
**Introduced in:** `c4c5c50` (V1.0 build)

### What it is

The middleware skips authentication checks for ALL routes under `/api/*`. Any unauthenticated user (or anyone with the URL) can call any API endpoint.

### How to replicate

1. Open an incognito browser window (no auth cookies)
2. Open the browser console
3. Run: `fetch('https://dashboard-chi-blue-6ybimqrfjv.vercel.app/api/companies/PartySlate/intelligence').then(r => r.json()).then(console.log)`
4. You will receive the full company intelligence response without logging in
5. Same works for `/api/reps/[name]/coaching`, `/api/chat`, `/api/notifications/slack`, etc.

### Repercussion if not fixed

- **Data exposure:** Anyone with the production URL can query all meeting data, rep coaching, company intelligence, MEDDIC analysis. This includes deal health, churn signals, internal action items.
- **Cost exposure:** `/api/chat` triggers Claude API calls and Gemini embeddings. Unauthenticated bursts could rack up Anthropic/Gemini costs.
- **Phishing surface:** `/api/notifications/slack` accepts arbitrary payloads (see F04). Combined with no auth, an attacker could send Slack messages to FullFunnel channels.
- **Rate limit bypass:** The chat rate limit (50/day per user) keys off `user_email`, but with no auth, the email is not verified. Could be spoofed.

### Example

```typescript
// Current middleware (src/middleware.ts:9-18)
if (pathname.startsWith("/api/")) {
  return NextResponse.next();
}
```

Note how API routes are SKIPPED before any auth check happens.

### Proposed fix

Move the API check to AFTER auth verification:

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes (no auth needed)
  if (pathname === "/login") return NextResponse.next();
  
  // Get user from Supabase session
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login?redirect=" + pathname, request.url));
  }
  
  return NextResponse.next();
}
```

### Risk of fix

**HIGH** - This is the riskiest change in the entire audit. Done wrong, it could:
- Lock you out of your own dashboard
- Break dev/preview deployments if env vars differ
- Break the chat client if it doesn't include auth headers

**Mitigation:**
- Add auth to ONE non-critical route first (e.g., `/api/analytics/chat`)
- Verify it works in preview before expanding
- Keep an emergency `SKIP_AUTH=true` env var as a panic button (remove after stable)
- Test login -> API call -> logout -> API call (should fail) flow
- Have a Vercel rollback ready

### References

- Code: `src/middleware.ts`
- Related: F02 (security headers), F06 (input validation)
- Existing docs: `../10-corner-cases.md` mentions auth but not this specific gap

---

## F02 - No Security Headers Configured  [Security]

**Severity:** Critical
**Category:** Security
**Location:** `next.config.ts` (entire file)
**Introduced in:** `c4c5c50` (V1.0 build) - never set

### What it is

`next.config.ts` is an empty object. No security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.) are configured. Vercel adds some defaults, but explicit configuration is missing.

### How to replicate

1. Open browser DevTools -> Network tab
2. Visit https://dashboard-chi-blue-6ybimqrfjv.vercel.app
3. Click any request, view Response Headers
4. Notice missing: `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`

### Repercussion if not fixed

- **Clickjacking:** Without `X-Frame-Options: DENY`, the dashboard could be embedded in an iframe on a malicious site, tricking users into clicking buttons unknowingly.
- **MIME sniffing attacks:** Without `X-Content-Type-Options: nosniff`, browsers could interpret files as different types, enabling some attacks.
- **HTTPS downgrade:** Without `Strict-Transport-Security`, first-time visitors over HTTP could be intercepted before redirecting to HTTPS.
- **Cross-site scripting:** Without a `Content-Security-Policy`, any injected script can run unrestricted.

### Example

Current `next.config.ts`:
```typescript
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

### Proposed fix

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Note:** Skip CSP for now - it requires careful testing because it can break inline scripts, third-party embeds (Vercel Analytics, Google Fonts), and existing functionality. Add CSP as a separate phase.

### Risk of fix

**MEDIUM** - Headers can break:
- Vercel Analytics if CSP is too strict (we're skipping CSP for this reason)
- Google Fonts loading
- Any iframe embeds (though we have none currently)

**Mitigation:**
- Test on preview deploy FIRST
- Verify Vercel Analytics still loads
- Verify fonts still load
- Verify all pages render correctly
- Roll out without CSP first, add CSP in a follow-up

### References

- Code: `next.config.ts`
- Vercel docs on security headers
- Related: F01

---

## F03 - Gemini API Key in URL Query String  [Security]

**Severity:** Critical
**Category:** Security
**Location:** `src/app/api/chat/route.ts:~293` (inside `embedQuery` function)
**Introduced in:** `c4c5c50` (V1.0 build)

### What it is

The Gemini API key is passed as a URL query parameter (`?key=${apiKey}`) instead of an Authorization header. URL query parameters are commonly logged by:
- Web servers (access logs)
- Proxies and CDNs
- Browser history (if any client-side fetch were ever done this way)
- Analytics tools
- Error monitoring services

### How to replicate

Read `src/app/api/chat/route.ts` and find the `embedQuery` function. You'll see something like:

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
  // ...
);
```

### Repercussion if not fixed

- If Vercel function logs ever include the request URL (e.g., on error), the key is exposed
- If a future code change accidentally exposes this fetch to the client, the key leaks
- If a proxy or middleware (e.g., AWS API Gateway in some setups) logs query strings, the key is in those logs
- Industry best practice: API keys belong in headers, not URLs

### Example

Currently (vulnerable to logging):
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "models/gemini-embedding-001", content: { parts: [{ text }] } }),
  }
);
```

### Proposed fix

Move the key to the `x-goog-api-key` header (Google's standard pattern):

```typescript
const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({ model: "models/gemini-embedding-001", content: { parts: [{ text }] } }),
  }
);
```

### Risk of fix

**LOW** - Single function, single change, easy to test. Just verify embeddings still work after the change.

**Mitigation:** Test with a query that triggers embedding lookup (any RAG query in Ask Blarney). If embeddings fail, the chat will fall back to score-only context.

### References

- Code: `src/app/api/chat/route.ts` `embedQuery` function
- Google Gemini API docs on authentication

---

## F04 - Slack Notification Accepts Any URL  [Security]

**Severity:** Critical
**Category:** Security
**Location:** `src/app/api/notifications/slack/route.ts:45`
**Introduced in:** `b03affe` (V1.1 - Slack integration)

### What it is

The Slack notification endpoint accepts any URL in the `meetingUrl` field of the request body and includes it as a clickable button in the Slack message. There is no validation that the URL belongs to the dashboard's domain.

### How to replicate

```bash
curl -X POST https://dashboard-chi-blue-6ybimqrfjv.vercel.app/api/notifications/slack \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Important Meeting Summary",
    "body": "Click below for details",
    "meetingUrl": "https://phishing-site.example.com/steal-creds"
  }'
```

The Slack message will arrive in the channel with a button labeled "View in Dashboard" linking to the phishing URL.

### Repercussion if not fixed

- **Phishing surface in Slack:** Combined with F01 (no API auth), an external attacker could send phishing messages into FullFunnel Slack channels
- **Reputation risk:** A user clicking the "View in Dashboard" button trusts it's the actual dashboard
- **Chained attack:** Pair with credential harvesting page that mimics login

### Example

Current code (no validation):
```typescript
if (payload.meetingUrl) {
  blocks.push({
    type: "actions",
    elements: [{
      type: "button",
      text: { type: "plain_text", text: "View in Dashboard" },
      url: payload.meetingUrl,  // ← accepts any URL
      style: "primary",
    }],
  });
}
```

### Proposed fix

Validate the URL belongs to the expected domain:

```typescript
if (payload.meetingUrl) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(payload.meetingUrl);
  } catch {
    return Response.json({ error: "Invalid meetingUrl format" }, { status: 400 });
  }
  
  const allowedHosts = [
    "dashboard-chi-blue-6ybimqrfjv.vercel.app",
    "localhost",
  ];
  
  if (!allowedHosts.some(h => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`))) {
    return Response.json({ error: "meetingUrl domain not allowed" }, { status: 400 });
  }
  
  // ... existing button code
}
```

### Risk of fix

**LOW** - Pure validation, no behavior change for legitimate use. Just rejects malicious URLs.

**Mitigation:** Verify the production dashboard URL is in the allowlist. Test that legitimate `/meetings/[id]` links still work.

### References

- Code: `src/app/api/notifications/slack/route.ts:45-57`
- Related: F01 (compounds the risk), F06 (input validation in general)

---

# HIGH FINDINGS (6)

## F05 - 7 of 11 API Routes Have Zero Test Coverage  [Tests]

**Severity:** High
**Category:** Test Coverage
**Location:** `src/__tests__/` (or wherever tests live)
**Introduced in:** Gradual - new routes added without tests

### What it is

Of the 11 API routes in the project, only 4 have test files. The remaining 7 critical routes have zero test coverage.

### How to replicate

```bash
# Count actual API routes
find src/app/api -name "route.ts" | wc -l    # Returns 11

# Count test files for API routes
find src/__tests__ -name "*api*" -o -name "*route*" 2>/dev/null | wc -l
```

Or look at `docs/08-testing.md` which lists tested routes vs the actual route count.

### Repercussion if not fixed

- **Silent regressions:** Changes to an untested API route can break it without anyone noticing until a user complains
- **Refactor risk:** We can't safely refactor or fix bugs in untested routes (which is why this audit is blocked on Phase 1 - tests first)
- **Auth migration risk:** Adding F01 auth to untested routes = double the risk
- **Knowledge loss:** Tests document expected behavior; without them, future devs guess

### Example

**Tested (4 routes):**
- `/api/chat` - tested
- `/api/actions/draft-email` - tested
- `/api/companies/[name]/intelligence` - tested
- `/api/notifications/slack` - tested (partial)

**Untested (7 routes):**
- `/api/actions/meeting-prep` - NO TEST
- `/api/actions/resummarize` - NO TEST
- `/api/meetings/[id]/notes` - NO TEST (newer feature)
- `/api/reps/[name]/coaching` - NO TEST (added in `d964aea`)
- `/api/reps/[name]/internal-insights` - NO TEST (added in `604f958`)
- `/api/analytics/chat` - NO TEST (fire-and-forget but should still test)
- `/api/slack/channels` - NO TEST

### Proposed fix

**Phase 1 of execution plan: Write tests for all 7 untested routes BEFORE doing any other fixes.**

Tests should:
- Capture CURRENT behavior, not desired behavior
- Cover happy path + error cases (missing fields, invalid input, DB errors)
- Use the same mocking patterns as existing tests in `src/__tests__/`
- If a test reveals a pre-existing bug, document it as a new finding and fix in a later phase

### Risk of fix

**ZERO** - Tests are pure additions. They don't change any code behavior. Worst case: a test fails because behavior is broken, in which case we've discovered a hidden bug.

### References

- Code: `src/__tests__/`
- Existing docs: `docs/08-testing.md`
- Test runner: `npx vitest run`
- This is BLOCKING for Phases 2-4 because tests provide the safety net

---

## F06 - No Input Validation with Zod on POST Routes  [Logic]

**Severity:** High
**Category:** Code Quality / Logic
**Location:** All POST API routes
**Introduced in:** Various (V1.0 onwards)

### What it is

POST API routes accept request bodies via `await request.json()` and validate fields with manual `if` statements (or not at all). There's no schema validation library (Zod, Joi, Valibot) anywhere in the codebase.

### How to replicate

1. Read any POST route, e.g., `src/app/api/actions/draft-email/route.ts`
2. Notice the validation pattern:
```typescript
const { meetingId, template } = await request.json();
if (!meetingId || !template || !TEMPLATES[template]) {
  return Response.json({ error: "Invalid request" }, { status: 400 });
}
```
3. Try sending invalid input:
```bash
curl -X POST https://dashboard-chi-blue-6ybimqrfjv.vercel.app/api/actions/draft-email \
  -H "Content-Type: application/json" \
  -d '{"meetingId": "not-a-uuid-just-a-very-long-string-that-could-cause-issues..."}'
```

### Repercussion if not fixed

- **Performance:** Unbounded string lengths can cause memory issues
- **Type confusion:** A field expecting a string might receive a number/object/array
- **Downstream errors:** Invalid input passes validation, fails deeper in the code, returns confusing errors
- **Hard to maintain:** Each route has its own ad-hoc validation pattern

### Example

Current pattern:
```typescript
const { meetingId, template } = await request.json();
if (!meetingId || !template || !TEMPLATES[template]) {
  return Response.json({ error: "Invalid request" }, { status: 400 });
}
```

What it doesn't catch:
- `meetingId` being 10MB long
- `meetingId` being a number, array, or object
- `meetingId` not matching UUID format
- Extra unexpected fields

### Proposed fix

Install Zod and add schemas:

```typescript
import { z } from "zod";

const DraftEmailSchema = z.object({
  meetingId: z.string().uuid(),
  template: z.enum(["client_followup", "internal_recap", "executive_briefing"]),
});

export async function POST(request: NextRequest) {
  let body;
  try {
    body = DraftEmailSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  
  const { meetingId, template } = body;
  // ... rest of handler
}
```

### Risk of fix

**MEDIUM** - Could reject valid requests if schemas are too strict. Mitigation:
- Start permissive, tighten over time
- Test each route after adding validation
- Add schemas one route at a time, not all at once

### References

- Code: All POST routes in `src/app/api/`
- Add to `package.json`: `zod`
- Related: F01 (input validation is part of API security)

---

## F07 - Rate Limiting Fails Open (Documented But Risky)  [Logic]

**Severity:** High (intentional but worth elevating awareness)
**Category:** Code Quality / Logic
**Location:** `src/app/api/chat/route.ts` (rate limit check)
**Introduced in:** `b176563` (V1.3 rate limiting)

### What it is

If the rate limit check itself throws an error (Supabase timeout, connection issue), the request **proceeds as if no rate limit exists**. This is intentional per `docs/10-corner-cases.md` ("fail open" design) but creates a real risk: if Supabase is degraded, attackers can spam queries with no upper bound.

### How to replicate

Cannot easily replicate in production without taking down Supabase. The behavior is:

```typescript
try {
  const { count } = await supabase.from("chat_analytics")./* rate limit query */;
  if (count >= DAILY_LIMIT) return Response.json({ error: "Rate limited" }, { status: 429 });
} catch {
  // ← falls through to allow query (fail open)
}
```

### Repercussion if not fixed

- **Cost spike:** During Supabase outages, Anthropic/Gemini API costs could explode
- **Quota exhaustion:** Could trigger Google Gemini quota errors for legitimate users later
- **No alarm:** No alert/log fires when fail-open kicks in

### Example

Current behavior table:

| Supabase status | Rate limit check result | Action |
|----------------|-------------------------|--------|
| Healthy, under limit | OK | Allow |
| Healthy, over limit | 429 | Block |
| Down/timeout | Error caught | **Allow (fail open!)** |

### Proposed fix

This is partially intentional, so the fix is more nuanced:

**Option A (recommended):** Keep fail-open but ADD logging and alerting:
```typescript
} catch (error) {
  console.error("[RATE_LIMIT] Check failed, failing open", { 
    user: userEmail, 
    error: error.message,
    timestamp: new Date().toISOString(),
  });
  // Still allow the query
}
```

**Option B:** Switch to fail-closed during outages:
```typescript
} catch {
  return Response.json(
    { error: "Service temporarily unavailable, please try again shortly" },
    { status: 503 }
  );
}
```

**Decision needed:** Which option does Neeraj prefer? Default to A (less disruptive) unless he wants stricter security.

### Risk of fix

**LOW** for Option A (just adds logging). **MEDIUM** for Option B (could block all users if Supabase has any glitch).

### References

- Code: `src/app/api/chat/route.ts` rate limit section
- Existing docs: `docs/10-corner-cases.md` "Rate Limits Fail Open" section
- Decision required from user

---

## F08 - Print Page Hardcoded Light Theme  [Theme]

**Severity:** High
**Category:** Theme / Visual
**Location:** `src/app/meetings/[id]/print/page.tsx`
**Introduced in:** `c4c5c50` (V1.0)

### What it is

The print page uses hardcoded light-mode classes (`bg-white text-black`) and hex colors (`#146DFA`) instead of theme-aware semantic classes. While intended for print output (always white paper), the print preview in dark mode looks visually broken.

### How to replicate

1. Switch dashboard to dark mode
2. Open any meeting detail page
3. Click the print/export option
4. Notice the print page has dark UI surrounding it but the page content is all white background with black text - jarring visual mismatch

### Repercussion if not fixed

- Cosmetic shock for dark mode users
- Looks like a bug even though it's "intentional" for print
- Print itself is fine (always white paper) but the BROWSER preview in dark mode looks wrong

### Example

Current (line ~49):
```tsx
<div className="bg-white text-black border-[#146DFA]">
```

### Proposed fix

Use semantic Tailwind classes that work in both modes BUT enforce light-on-white via `print:` variants:

```tsx
<div className="bg-white text-black print:bg-white print:text-black border-blue-600">
```

Or wrap the print page in a `print` color scheme:
```tsx
<html style={{ colorScheme: "light" }}>
```

### Risk of fix

**LOW** - Single page, isolated. Easy to verify in both light and dark modes.

### References

- Code: `src/app/meetings/[id]/print/page.tsx`
- Related: F11 (broader theme issues)

---

## F09 - Reps Page Treats Null avgScore as 0 in Sorting  [Logic]

**Severity:** High
**Category:** Code Quality / Logic
**Location:** `src/app/reps/page.tsx:~59-70`
**Introduced in:** `604f958` (Reps index page)

### What it is

When sorting reps by score, the code uses `(b.avgScore ?? 0) - (a.avgScore ?? 0)`. Reps who have no scored meetings get treated as having a score of 0, which ranks them ALONGSIDE actual zero-score performers. This is misleading - "no data" is not the same as "scored zero."

### How to replicate

1. Find a rep with no scored meetings (just internal meetings, no external)
2. Sort the Reps page by "Score (lowest)"
3. The unscored rep will appear at the bottom alongside any rep with a 0 score
4. Click into that rep - they have no rep_score data, but the table makes them look like they're failing

### Repercussion if not fixed

- **Misleading rankings:** Leadership might think a rep is underperforming when they actually have no data
- **Coaching errors:** Could trigger unnecessary coaching conversations
- **Trust:** If users notice this, they'll lose trust in the data quality

### Example

```typescript
// Current (problematic)
case "score":
  return (b.avgScore ?? 0) - (a.avgScore ?? 0);

// What happens for a rep with avgScore = null:
// (null ?? 0) - (8.5 ?? 0) = 0 - 8.5 = -8.5
// They sort BELOW the high performer, looking bad
```

### Proposed fix

Filter out unscored reps OR sort them to a separate "unranked" section:

```typescript
// Filter out unscored reps from score-based sorting
case "score":
  if (a.avgScore === null && b.avgScore === null) return 0;
  if (a.avgScore === null) return 1;  // Push nulls to bottom
  if (b.avgScore === null) return -1; // Push nulls to bottom
  return (b.avgScore ?? 0) - (a.avgScore ?? 0);
```

Or visually distinguish them:
```typescript
// In the table cell
{rep.avgScore !== null ? formatScore(rep.avgScore) : <span className="text-muted-foreground">No data</span>}
```

### Risk of fix

**LOW** - Single function, easy to test with a rep that has no scored meetings.

### References

- Code: `src/app/reps/page.tsx`
- Related: F10 (loading states), F13 (empty state messaging)

---

## F10 - Some Loading States Missing  [UX]

**Severity:** High
**Category:** UX / Navigation
**Location:** Multiple components
**Introduced in:** Gradual

### What it is

Some components fetch data but don't show a loading skeleton or placeholder while fetching. Users see empty content briefly before data populates.

### How to replicate

1. Open Network tab in DevTools
2. Throttle to "Slow 3G"
3. Navigate to a meeting detail page
4. Notice: Intelligence Tabs section flashes empty before content loads
5. Same for Company Intelligence Sidebar

### Repercussion if not fixed

- **Perceived performance:** App feels slower/buggier than it is
- **Confusion:** Users may think there's no data when there's just a delay
- **Layout shift:** Content jumps when data arrives, hurting CLS metric

### Example

Component pattern that's missing loading state:
```tsx
const { data: notes } = useMeetingNotes(meetingId);
return (
  <div>
    {notes?.map(note => /* render */)}
  </div>
);
// ↑ Shows nothing while loading, then snaps content in
```

### Proposed fix

Add loading skeleton:
```tsx
const { data: notes, isLoading } = useMeetingNotes(meetingId);
if (isLoading) return <Skeleton className="h-20" />;
return (
  <div>
    {notes?.map(note => /* render */)}
  </div>
);
```

### Risk of fix

**LOW** - Pure addition, no behavior change.

### References

- Code: `src/components/meetings/intelligence-tabs.tsx`, `src/components/companies/intelligence-sidebar/`
- Related: F13 (empty state messaging)

---

# MEDIUM FINDINGS (6)

## F11 - Hardcoded Hex Colors in 8+ Components  [Theme]

**Severity:** Medium
**Category:** Theme / Visual
**Location:** Multiple components
**Introduced in:** Gradual

### What it is

Several components have hardcoded hex color values (e.g., `#146DFA`, `#0A0A0A`, `#10b981`) instead of using CSS variables or semantic Tailwind classes. They mostly work in both themes (because they're accent colors, not backgrounds), but maintenance becomes harder if the brand color changes.

### How to replicate

```bash
grep -rn "#[0-9a-fA-F]\{6\}" src/components/ --include="*.tsx" | head -20
```

You'll see hex colors in: `circular-gauge.tsx`, `chat-message.tsx`, `rep-comparison-table.tsx`, `intelligence-tabs.tsx`, `competitor-mentions.tsx` (the recharts work uses HSL but for the gradient), and others.

### Repercussion if not fixed

- **Maintenance burden:** Brand color change requires touching 8+ files
- **Inconsistency drift:** Easy to use slightly different shades in different files
- **No single source of truth**

### Example

```tsx
// rep-comparison-table.tsx
<MiniSparkline color="#10b981" />  // emerald
<MiniSparkline color="#ef4444" />  // red

// Should be:
<MiniSparkline color="hsl(var(--color-success))" />
<MiniSparkline color="hsl(var(--color-destructive))" />
```

### Proposed fix

Define brand colors as CSS variables in `globals.css`, then use them everywhere:

```css
:root {
  --color-ff-blue: 217 91% 53%;     /* #146DFA */
  --color-success: 142 71% 45%;     /* #10b981 */
  --color-destructive: 0 84% 60%;   /* #ef4444 */
}
```

Then in components: `fill="hsl(var(--color-ff-blue))"`.

### Risk of fix

**LOW** but tedious. Each file change is small and easy to verify, but there are many of them.

### References

- Code: 8+ component files
- Related: F12, F14

---

## F12 - Score Badge Null State Uses Non-Semantic Gray  [Theme]

**Severity:** Medium
**Category:** Theme / Visual
**Location:** `src/components/shared/score-badge.tsx:24-28`
**Introduced in:** V1.0

### What it is

The score badge component uses `bg-gray-100` / `dark:bg-gray-800` for null states instead of semantic `bg-muted`. This is a minor design system inconsistency.

### How to replicate

Read `src/components/shared/score-badge.tsx` line 24-28.

### Repercussion if not fixed

- Inconsistent with rest of design system
- If gray palette is updated globally via theme tokens, this won't pick it up

### Example

```tsx
// Current
className="inline-flex items-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"

// Fixed
className="inline-flex items-center rounded-full bg-muted text-muted-foreground"
```

### Proposed fix

Replace with semantic Tailwind classes (`bg-muted`, `text-muted-foreground`).

### Risk of fix

**LOW** - Single file, single change, visually identical for current theme.

### References

- Code: `src/components/shared/score-badge.tsx`

---

## F13 - Inconsistent Empty State Messaging  [UX]

**Severity:** Medium
**Category:** UX / Navigation
**Location:** Multiple pages
**Introduced in:** Gradual

### What it is

Empty state messages vary in tone, format, and helpfulness across pages. Some explain WHY data is empty (filters applied, no data yet), others just say "No data."

### How to replicate

Compare:
- Companies page empty: "No companies with score data"
- Reps page empty: "No rep data" / "Rep profiles will appear once meetings are scored"
- Company detail with no meetings: (no message at all)
- Meeting feed with filters: "Showing 0 of 0 meetings"

### Repercussion if not fixed

- User confusion ("is this broken or do I just have no data?")
- Inconsistent voice/tone undermines polish
- Unclear next actions

### Example

**Bad:** "No data"
**Better:** "No companies match these filters. Try clearing the search or stage filter."
**Best:** "No companies match these filters. [Clear filters] [Show all companies]"

### Proposed fix

Audit all empty states. Use the existing `EmptyState` shared component consistently. Each empty state should have:
1. A clear icon
2. A short title (what's missing)
3. A subtitle (why it might be empty)
4. An action button when applicable

### Risk of fix

**LOW** - Pure UI changes, no logic.

### References

- Code: `src/components/shared/empty-state.tsx`, multiple page files
- Related: F10

---

## F14 - Health Page "Checking" Dot Invisible in Dark Mode  [Theme]

**Severity:** Medium
**Category:** Theme / Visual
**Location:** `src/components/health/connection-status.tsx:18`
**Introduced in:** V1.0 / V1.1

### What it is

The "checking" status dot uses `bg-gray-400` without a `dark:` variant. In dark mode, this gray dot blends into the dark background and is essentially invisible.

### How to replicate

1. Switch to dark mode
2. Navigate to the System Health page
3. Refresh - during the brief "checking" state, the dot is invisible

### Repercussion if not fixed

- Dark mode users can't see the "checking" state
- They might think the system check is broken
- Minor visual inconsistency

### Example

```tsx
// Current
const DOT_COLORS = {
  checking: "bg-gray-400 animate-pulse",
};

// Fixed
const DOT_COLORS = {
  checking: "bg-gray-400 dark:bg-gray-600 animate-pulse",
};
```

### Proposed fix

Add `dark:bg-gray-600` to the checking status.

### Risk of fix

**ZERO** - Single line, single class addition.

### References

- Code: `src/components/health/connection-status.tsx:18`
- Related: F11

---

## F15 - Stakeholder "Show All" Not Paginated  [Perf]

**Severity:** Medium
**Category:** Performance
**Location:** `src/components/companies/intelligence-sidebar/stakeholders-section.tsx`
**Introduced in:** V1.1 (Company Intelligence Sidebar)

### What it is

The Stakeholders section in the Company Intelligence Sidebar has a "Show all" button. When clicked, it renders ALL stakeholders without pagination. For a company with 50+ contacts, this could render hundreds of DOM nodes at once.

### How to replicate

1. Find a company with many participants across many meetings
2. Open its Company Intelligence Sidebar
3. Click "Show all" in Stakeholders section
4. Notice DOM grows; on mobile this could lag noticeably

### Repercussion if not fixed

- **Mobile lag:** Render performance degrades on lower-end devices
- **Memory pressure:** Many DOM nodes for a single section
- **Currently OK:** Most companies have <20 stakeholders, so it's not biting yet

### Example

```tsx
// Current
{showAll ? stakeholders.map(/*...*/) : stakeholders.slice(0, 5).map(/*...*/)}

// Better
{showAll 
  ? stakeholders.slice(0, 50).map(/*...*/) 
  : stakeholders.slice(0, 5).map(/*...*/)}
{showAll && stakeholders.length > 50 && (
  <p>Showing 50 of {stakeholders.length}</p>
)}
```

### Proposed fix

Cap "Show all" at a reasonable limit (50). Show a count if truncated.

### Risk of fix

**LOW** - Pure render change.

### References

- Code: `src/components/companies/intelligence-sidebar/stakeholders-section.tsx`

---

## F16 - Missing aria-labels on Icon-Only Buttons  [A11y]

**Severity:** Medium
**Category:** Accessibility
**Location:** Multiple files (e.g., reps page view toggle, action buttons)
**Introduced in:** Gradual

### What it is

Several icon-only buttons (just an icon, no visible text) lack `aria-label` attributes. Screen reader users can't tell what these buttons do.

### How to replicate

```bash
grep -rn 'lucide-react' src/components/ --include="*.tsx" -l | head -5
```

Check each result for `<button>` elements with only an icon child and no `aria-label`.

Specific examples:
- Reps page table/card view toggle (icon-only buttons)
- Some chart action buttons
- Some sidebar collapse/expand buttons

### Repercussion if not fixed

- **Screen reader users:** Cannot navigate the dashboard
- **Accessibility compliance:** Fails WCAG 2.1 Level A
- **Future enterprise:** Accessibility may be required for enterprise customers

### Example

```tsx
// Bad
<button onClick={() => setView("table")}>
  <List />
</button>

// Good
<button onClick={() => setView("table")} aria-label="Switch to table view">
  <List />
</button>
```

### Proposed fix

Audit all icon-only buttons. Add `aria-label` describing what the button does.

### Risk of fix

**ZERO** - Pure additions, no behavior change.

### References

- Code: Multiple components
- WCAG 2.1 Success Criterion 4.1.2 Name, Role, Value

---

# LOW FINDINGS (5)

## F17 - Reps Page useMemo Over-Recomputes  [Perf]

**Severity:** Low
**Category:** Performance
**Location:** `src/app/reps/page.tsx:~85`
**Introduced in:** `604f958`

### What it is

The `useMemo` for reps aggregation depends on `[meetings, sortBy]`. Changing `sortBy` causes the entire aggregation to re-run, when it should only re-sort.

### How to replicate

Add `console.log` inside the useMemo. Change sort order. Notice it logs every time.

### Repercussion if not fixed

- Minor: redundant computation on every sort change
- Currently fine with small datasets (5 reps)
- Would matter at 50+ reps

### Proposed fix

Split into two useMemos:
```tsx
const aggregatedReps = useMemo(() => /* expensive aggregation */, [meetings]);
const sortedReps = useMemo(() => sortBy === "score" ? /* sort */ : /* other sort */, [aggregatedReps, sortBy]);
```

### Risk of fix

**LOW** - Standard React optimization pattern.

### References

- Code: `src/app/reps/page.tsx`

---

## F18 - Recording Banner Duration Text Too Small  [UX]

**Severity:** Low
**Category:** UX / Navigation
**Location:** `src/app/meetings/[id]/page.tsx:166`
**Introduced in:** `943900d`

### What it is

The duration badge on the Zoom recording banner uses `text-[9px]` which is hard to read.

### How to replicate

Open any meeting detail page. Look at the duration text on the recording thumbnail.

### Repercussion if not fixed

Cosmetic only.

### Proposed fix

Change to `text-xs` (12px).

### Risk of fix

**ZERO**

### References

- Code: `src/app/meetings/[id]/page.tsx:166`

---

## F19 - Rate Limit Doesn't Show Remaining Quota  [UX]

**Severity:** Low
**Category:** UX / Navigation
**Location:** Chat interface
**Introduced in:** `b176563` (V1.3)

### What it is

When a user hits the rate limit, they see "Daily limit reached (50 queries)" but during normal use, they don't know how many queries they have left.

### Repercussion if not fixed

Mild UX friction. Users hit the limit unexpectedly.

### Proposed fix

Show "X of 50 queries used today" in the chat interface, perhaps in the input area or settings menu.

### Risk of fix

**LOW** - Requires another Supabase query for current count, but read-only.

### References

- Code: `src/components/search/chat-interface.tsx`, `src/app/api/chat/route.ts`

---

## F20 - Competitor Section Silently Truncates to 5 Items  [UX]

**Severity:** Low
**Category:** UX / Navigation
**Location:** `src/components/companies/intelligence-sidebar/competitor-section.tsx`
**Introduced in:** V1.1

### What it is

The Competitor Mentions section in the sidebar shows max 5 competitors. If a company has more, they're silently dropped without indication.

### Repercussion if not fixed

Users don't know there are more competitors mentioned.

### Proposed fix

Show "Showing 5 of 12" if truncated. Add "Show all" button.

### Risk of fix

**LOW**

### References

- Code: `src/components/companies/intelligence-sidebar/competitor-section.tsx`

---

## F21 - No Debouncing on Sort/Filter Controls  [Perf]

**Severity:** Low
**Category:** Performance
**Location:** Multiple pages (Reps, Companies, Meetings)
**Introduced in:** Gradual

### What it is

Sort dropdowns and filter inputs trigger state updates immediately on every change. For typing in a search box, this causes a re-render on every keystroke.

### Repercussion if not fixed

Minor performance impact during typing. Currently negligible with small datasets.

### Proposed fix

Debounce search inputs by 200-300ms using `useDebouncedCallback` or similar.

### Risk of fix

**LOW**

### References

- Code: Multiple files
- Could install `use-debounce` package

---

## Findings Summary by Category

| Category | Critical | High | Medium | Low | Total |
|----------|---------:|-----:|-------:|----:|------:|
| Security | 4 | 1 | 0 | 0 | 5 |
| Test Coverage | 0 | 1 | 0 | 0 | 1 |
| Code Quality / Logic | 0 | 2 | 0 | 0 | 2 |
| Theme / Visual | 0 | 1 | 3 | 0 | 4 |
| UX / Navigation | 0 | 1 | 1 | 3 | 5 |
| Performance | 0 | 0 | 1 | 2 | 3 |
| Accessibility | 0 | 0 | 1 | 0 | 1 |
| **TOTAL** | **4** | **6** | **6** | **5** | **21** |

## Findings Mapped to Execution Phases

See `03-execution-plan.md` for the full phased rollout. Quick reference:

- **Phase 1 (Tests):** F05
- **Phase 2 (Cosmetic):** F11, F12, F13, F14, F16, F18
- **Phase 3 (Logic):** F03, F04, F08, F09, F19, F20, F21, F17
- **Phase 4 (Security infrastructure):** F01, F02, F06, F07, F10
