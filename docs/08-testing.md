# 08 - Testing

This document covers the complete testing setup for the Meeting Intelligence Dashboard: frameworks, configuration, every test file, mock patterns, commands, and how to add new tests.

---

## Table of Contents

1. [Framework and Tools](#1-framework-and-tools)
2. [Configuration](#2-configuration)
3. [Test Inventory](#3-test-inventory)
4. [Unit Tests](#4-unit-tests)
5. [API Tests](#5-api-tests)
6. [Integration Tests](#6-integration-tests)
7. [Component Tests](#7-component-tests)
8. [E2E Tests](#8-e2e-tests)
9. [Mock Patterns](#9-mock-patterns)
10. [Commands](#10-commands)
11. [How to Add a New Test](#11-how-to-add-a-new-test)
12. [Coverage and CI Notes](#12-coverage-and-ci-notes)

---

## 1. Framework and Tools

| Tool | Version | Purpose |
|---|---|---|
| Vitest | 4.1.2 | Test runner and assertion library (unit, API, integration, component tests) |
| @testing-library/react | -- | Component rendering and DOM queries |
| jsdom | -- | Browser environment simulation for Vitest |
| Playwright | -- | End-to-end browser testing |
| Chromium | -- | Browser used by Playwright (bundled with Playwright) |

Vitest was chosen over Jest for its native ESM support, faster execution, and tight integration with the Vite-based toolchain.

---

## 2. Configuration

### Vitest Config

**File:** `vitest.config.ts`

Key settings:
- **Environment:** `jsdom` -- simulates a browser DOM so component tests and any code that references `window` or `document` work correctly
- **Path alias:** `@/*` maps to `src/*`, matching the project's `tsconfig.json` paths. This means test imports like `import { formatDate } from "@/lib/format"` resolve correctly.
- **Setup file:** `src/__tests__/setup.ts` -- runs before every test file

### Setup File

**File:** `src/__tests__/setup.ts`

This file imports `@testing-library/jest-dom`, which adds custom DOM matchers to Vitest's `expect`. This enables assertions like:

```typescript
expect(element).toBeInTheDocument();
expect(element).toHaveTextContent("Score: 85");
expect(element).toBeVisible();
expect(element).toHaveClass("text-green-500");
```

Without this setup file, these matchers would be undefined and tests using them would fail.

### Playwright Config

Playwright is configured separately for E2E tests with:
- Chromium as the sole browser target
- Base URL pointing to the local dev server
- Screenshot-on-failure enabled for debugging

---

## 3. Test Inventory

**13 test files** containing **77 tests** total, organized by category:

| Category | Location | Files | Tests |
|---|---|---|---|
| Unit | `src/__tests__/unit/` | 4 | 27 |
| API | `src/__tests__/api/` | 4 | 11 |
| Integration | `src/__tests__/` | 1 | 4 |
| Component | `src/__tests__/components/` | 3 | 11 |
| E2E | `src/__tests__/e2e/` | 1 | 12 |
| **Total** | | **13** | **77** |

*Note: Some tests are grouped under `describe` blocks. The counts above reflect individual `it`/`test` calls.*

---

## 4. Unit Tests

Unit tests validate pure utility functions with no external dependencies. They are the fastest tests in the suite and require no mocking.

### 4.1 format.test.ts

**File:** `src/__tests__/unit/format.test.ts`
**Tests:** 9
**Functions under test:** `formatDate`, `formatDateTime`, `formatDuration`, `formatScore`

| Test | What it validates |
|---|---|
| formatDate returns formatted date | Converts ISO date string to human-readable format (e.g., "Jan 15, 2025") |
| formatDate handles null/undefined | Returns fallback string instead of crashing |
| formatDateTime includes time | Includes hours and minutes in output |
| formatDateTime handles null/undefined | Returns fallback string |
| formatDuration formats minutes | Converts raw minutes to "Xh Ym" format |
| formatDuration handles zero | Returns "0m" or equivalent for zero-length meetings |
| formatDuration handles null | Returns fallback for missing duration |
| formatScore formats number | Converts numeric score to display format (e.g., "85/100") |
| formatScore handles edge cases | Handles 0, 100, null, undefined |

### 4.2 stage.test.ts

**File:** `src/__tests__/unit/stage.test.ts`
**Tests:** 4
**Functions under test:** `getStageLabel`, `getStageColor`

| Test | What it validates |
|---|---|
| getStageLabel returns correct label | Maps stage keys (e.g., "discovery", "demo") to display labels |
| getStageLabel handles unknown stage | Returns a sensible default for unrecognized stage values |
| getStageColor returns correct color | Maps stage keys to Tailwind color classes |
| getStageColor handles unknown stage | Returns a default color for unrecognized stages |

### 4.3 constants.test.ts

**File:** `src/__tests__/unit/constants.test.ts`
**Tests:** 6
**Constants under test:** `STAGE_CONFIG`, `NAV_ITEMS`, `SCORE_BANDS`

| Test | What it validates |
|---|---|
| STAGE_CONFIG has all expected stages | Verifies the config object contains entries for every pipeline stage |
| STAGE_CONFIG entries have required fields | Each entry has label, color, and any other required properties |
| NAV_ITEMS has correct structure | Navigation items have path, label, and icon properties |
| NAV_ITEMS paths are valid | All paths start with `/` and are non-empty |
| SCORE_BANDS covers full range | Score bands cover 0-100 without gaps |
| SCORE_BANDS have correct thresholds | Band boundaries are in ascending order and non-overlapping |

### 4.4 scores.test.ts

**File:** `src/__tests__/unit/scores.test.ts`
**Tests:** 8
**Functions under test:** `getPrimaryScore`, `getRepPerformanceScore`

| Test | What it validates |
|---|---|
| getPrimaryScore extracts overall score | Pulls the primary score from a scoring breakdown JSONB object |
| getPrimaryScore handles missing breakdown | Returns null or default when scoring_breakdown is missing |
| getPrimaryScore handles malformed data | Does not crash on unexpected JSONB shapes |
| getPrimaryScore clamps to 0-100 | Values outside range are clamped or rejected |
| getRepPerformanceScore calculates correctly | Computes rep performance from component scores |
| getRepPerformanceScore handles missing components | Returns null when required sub-scores are absent |
| getRepPerformanceScore handles empty array | Returns null for empty meetings list |
| getRepPerformanceScore handles single meeting | Works correctly with just one data point |

---

## 5. API Tests

API tests validate request handling, input validation, and response formatting for the server-side API routes. They mock external dependencies (Supabase, Anthropic, fetch) and test the route handler logic in isolation.

### 5.1 chat.test.ts

**File:** `src/__tests__/api/chat.test.ts`
**Tests:** 3
**Route under test:** `/api/chat`

| Test | What it validates |
|---|---|
| Rejects request without message | Returns 400 when `message` field is missing from request body |
| Accepts valid request with message | Returns 200 and initiates streaming response for valid input |
| Rate limit mock works correctly | Verifies rate limiting logic is applied (mock validates the check runs) |

### 5.2 draft-email.test.ts

**File:** `src/__tests__/api/draft-email.test.ts`
**Tests:** 3
**Route under test:** `/api/actions/draft-email`

| Test | What it validates |
|---|---|
| Rejects request without meetingId | Returns 400 when `meetingId` is missing |
| Validates template parameter | Rejects invalid template values; accepts valid ones |
| Returns drafted email for valid request | Full happy-path: valid meetingId + template returns generated email text |

### 5.3 intelligence.test.ts

**File:** `src/__tests__/api/intelligence.test.ts`
**Tests:** 2
**Route under test:** `/api/intelligence`

| Test | What it validates |
|---|---|
| Returns intelligence data for valid company | Happy path with mocked Supabase data |
| Handles missing company gracefully | Returns appropriate error when company is not found |

### 5.4 slack.test.ts

**File:** `src/__tests__/api/slack.test.ts`
**Tests:** 3
**Route under test:** `/api/actions/slack`

| Test | What it validates |
|---|---|
| Rejects request without title | Returns 400 when `title` field is missing |
| Rejects request without body | Returns 400 when `body` field is missing |
| Falls back to webhook when bot token unavailable | When `SLACK_BOT_TOKEN` is unset, uses `SLACK_WEBHOOK_URL` instead |

---

## 6. Integration Tests

Integration tests verify behavior that spans multiple layers (e.g., middleware + auth + routing).

### 6.1 middleware.test.ts

**File:** `src/__tests__/middleware.test.ts`
**Tests:** 4
**Module under test:** `src/middleware.ts`

| Test | What it validates |
|---|---|
| Redirects unauthenticated user to /login | Simulates a request with no session cookie; verifies redirect to /login |
| Allows authenticated user through | Simulates a request with a valid session; verifies the request proceeds |
| Refreshes expired session | Simulates an expired-but-refreshable token; verifies transparent refresh |
| Exempts /api routes from auth | Requests to /api/* paths pass through without auth checks |

---

## 7. Component Tests

Component tests render React components in the jsdom environment and verify their DOM output and behavior.

### 7.1 shared.test.ts

**File:** `src/__tests__/components/shared.test.ts`
**Tests:** 5
**Components under test:** `ScoreBadge`, `StageTypeBadge`, `EmptyState`

| Test | What it validates |
|---|---|
| ScoreBadge renders correct score | Displays the numeric score value |
| ScoreBadge applies correct color band | Uses green for high scores, yellow for medium, red for low |
| StageTypeBadge renders stage label | Displays the human-readable stage label |
| StageTypeBadge applies correct color | Uses the stage's configured color class |
| EmptyState renders message and icon | Displays the provided empty state message and icon |

### 7.2 send-to-slack.test.ts

**File:** `src/__tests__/components/send-to-slack.test.ts`
**Tests:** 3
**Component under test:** `SendToSlack`

| Test | What it validates |
|---|---|
| Renders send button | The "Send to Slack" button is present in the DOM |
| Shows channel picker when bot token configured | Dropdown of channels appears (mocked channel list) |
| Calls API on submit | Clicking send triggers a POST to `/api/actions/slack` with correct payload |

### 7.3 sync-indicator.test.ts

**File:** `src/__tests__/components/sync-indicator.test.ts`
**Tests:** 3
**Component under test:** `SyncIndicator`

| Test | What it validates |
|---|---|
| Shows "synced" state when fresh | Displays green indicator when last sync is recent |
| Shows "stale" state when data is old | Displays warning indicator when last sync exceeds threshold |
| Shows correct timestamp | Displays the last sync time in human-readable format |

---

## 8. E2E Tests

End-to-end tests use Playwright to drive a real Chromium browser against the running application. They test complete user workflows from login through feature interaction.

### 8.1 smoke.spec.ts

**File:** `src/__tests__/e2e/smoke.spec.ts`
**Tests:** 12
**Browser:** Chromium

| Test | What it validates |
|---|---|
| Login page loads | `/login` renders the email and password fields |
| Login with valid credentials | Submitting valid credentials redirects to the dashboard |
| Login with invalid credentials | Submitting bad credentials shows an error message |
| Scorecard page loads | `/scorecard` renders the scoring overview |
| Scorecard displays scores | Score cards show numeric values |
| Meetings list page loads | `/meetings` renders the meetings table |
| Meeting detail page loads | Clicking a meeting navigates to its detail view |
| Companies page loads | `/companies` renders the company list |
| Company detail page loads | Clicking a company navigates to its detail view |
| Ask Blarney chat loads | `/chat` renders the chat input |
| Ask Blarney accepts input | Typing a message and submitting shows a response area |
| System health page loads | `/system-health` renders pipeline status indicators |

### E2E Prerequisites

- The application must be running locally (`npm run dev`)
- A test user must exist in Supabase with known credentials
- Test credentials should be set via environment variables for CI (not hardcoded)
- Playwright must be installed (`npx playwright install chromium`)

---

## 9. Mock Patterns

Consistent mocking patterns are used across the test suite. Understanding these patterns is essential for writing new tests.

### 9.1 Supabase Mock

Used in: API tests, middleware tests, component tests

```typescript
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { /* mock data */ },
            error: null,
          })),
          data: [{ /* mock array data */ }],
          error: null,
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [{ /* mock data */ }],
            error: null,
          })),
        })),
      })),
    })),
    rpc: vi.fn(() => ({
      data: [{ /* mock RPC result */ }],
      error: null,
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: "test-user-id", email: "test@example.com" } },
        error: null,
      })),
    },
  })),
}));
```

The key insight is the **chainable query builder** pattern: each method returns an object with the next method in the chain, mimicking Supabase's fluent API. This allows tests to mock queries like `supabase.from("scored_meetings").select("*").eq("id", meetingId).single()`.

### 9.2 Anthropic Mock

Used in: API tests for chat, draft-email, meeting-prep, resummarize

```typescript
class MockAnthropic {
  messages = {
    create: vi.fn(() => ({
      content: [{ type: "text", text: "Mocked AI response" }],
    })),
    stream: vi.fn(() => ({
      toReadableStream: vi.fn(() => new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("Streamed response"));
          controller.close();
        },
      })),
    })),
  };
}

vi.mock("@anthropic-ai/sdk", () => ({
  default: MockAnthropic,
}));
```

The mock provides both `messages.create` (for non-streaming action routes) and `messages.stream` (for the chat route). The `toReadableStream` mock returns a minimal `ReadableStream` that immediately emits data and closes.

### 9.3 Fetch Mock

Used in: Slack tests, Gemini embedding tests, any test calling an external HTTP endpoint

```typescript
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ /* mock response */ }),
    status: 200,
  })
) as unknown as typeof fetch;
```

For Slack tests specifically, the mock verifies that `fetch` was called with the correct Slack API URL and payload:

```typescript
expect(fetch).toHaveBeenCalledWith(
  "https://slack.com/api/chat.postMessage",
  expect.objectContaining({
    method: "POST",
    headers: expect.objectContaining({
      Authorization: expect.stringContaining("Bearer"),
    }),
  })
);
```

### 9.4 Environment Variable Mocks

Used in: tests that depend on specific env var values

```typescript
// Set before test
vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
vi.stubEnv("SLACK_BOT_TOKEN", "xoxb-test-token");

// Or use process.env directly
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv, SLACK_BOT_TOKEN: "xoxb-test" };
});
afterEach(() => {
  process.env = originalEnv;
});
```

---

## 10. Commands

All test commands are defined in `package.json` under `scripts`:

| Command | What it does |
|---|---|
| `npm test` | Run all Vitest tests once and exit. Used for CI and quick checks. |
| `npm run test:watch` | Run Vitest in watch mode. Re-runs affected tests when files change. Best for active development. |
| `npm run test:coverage` | Run all tests with code coverage collection. Generates an HTML report in `coverage/`. |
| `npm run test:ui` | Launch the Vitest UI dashboard in the browser. Provides a visual interface for browsing tests, viewing results, and re-running individual tests. |
| `npm run test:e2e` | Run Playwright E2E tests. Requires the dev server to be running (`npm run dev`). |

### Running a Single Test File

```bash
# Run a specific test file
npx vitest run src/__tests__/unit/format.test.ts

# Run tests matching a pattern
npx vitest run --reporter=verbose format

# Run a specific E2E test
npx playwright test src/__tests__/e2e/smoke.spec.ts
```

### Running Tests in CI

```bash
# Full test suite (unit + API + integration + component)
npm test

# E2E (requires the app to be built and served)
npm run build && npm start &
npx playwright test
```

---

## 11. How to Add a New Test

### Step 1: Determine the Test Category

| If you are testing... | Put the file in... | Type |
|---|---|---|
| A pure utility function | `src/__tests__/unit/` | Unit |
| An API route handler | `src/__tests__/api/` | API |
| Middleware or cross-cutting concern | `src/__tests__/` | Integration |
| A React component's rendering | `src/__tests__/components/` | Component |
| A full user workflow in a browser | `src/__tests__/e2e/` | E2E |

### Step 2: Create the Test File

Name the file to match what you are testing:

- `src/__tests__/unit/newutil.test.ts` for a utility function
- `src/__tests__/api/new-route.test.ts` for an API route
- `src/__tests__/components/new-component.test.ts` for a component
- `src/__tests__/e2e/new-flow.spec.ts` for an E2E test

### Step 3: Write the Test

Template for a unit test:

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "@/lib/my-module";

describe("myFunction", () => {
  it("returns expected output for valid input", () => {
    const result = myFunction("input");
    expect(result).toBe("expected output");
  });

  it("handles null gracefully", () => {
    const result = myFunction(null);
    expect(result).toBeNull();
  });
});
```

Template for an API test:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase before importing the route
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [{ id: "1", name: "Test" }],
          error: null,
        })),
      })),
    })),
  })),
}));

describe("POST /api/my-route", () => {
  it("rejects request without required field", async () => {
    const { POST } = await import("@/app/api/my-route/route");

    const request = new Request("http://localhost/api/my-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

Template for a component test:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  it("renders the title", () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

Template for an E2E test:

```typescript
import { test, expect } from "@playwright/test";

test("my feature works end to end", async ({ page }) => {
  await page.goto("/my-page");
  await expect(page.locator("h1")).toHaveText("My Page");
  await page.click("button:has-text('Submit')");
  await expect(page.locator(".success")).toBeVisible();
});
```

### Step 4: Mock External Dependencies

Follow the patterns in section 9. The general rule:
- **Mock everything external** -- Supabase, Anthropic, fetch, env vars
- **Do not mock the code under test** -- that defeats the purpose
- **Place mocks before imports** of the code under test (Vitest hoists `vi.mock()` calls, but explicit ordering avoids confusion)

### Step 5: Run and Verify

```bash
# Run your new test in isolation
npx vitest run src/__tests__/unit/newutil.test.ts

# Run in watch mode during development
npx vitest watch src/__tests__/unit/newutil.test.ts

# Run the full suite to check for regressions
npm test
```

---

## 12. Coverage and CI Notes

### Coverage

Run `npm run test:coverage` to generate coverage reports. The HTML report is written to `coverage/` in the project root. Open `coverage/index.html` in a browser to explore per-file line, branch, and function coverage.

There are no enforced coverage thresholds currently. Coverage is used for visibility, not as a gate.

### CI Considerations

If adding these tests to a CI pipeline:

1. **Vitest tests** (`npm test`) need no special setup beyond `npm install`
2. **E2E tests** require:
   - Building the app (`npm run build`)
   - Starting the server (`npm start`)
   - Installing Playwright browsers (`npx playwright install chromium`)
   - Setting test user credentials via env vars
3. **Test environment variables** -- CI should set `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, etc. to dummy values. The mocks prevent actual API calls, but some code paths check for the presence of these variables.

### Known Limitations

- No snapshot tests are used (intentional -- snapshots create brittle tests for a rapidly evolving UI)
- E2E tests depend on a running dev server and a real Supabase instance with test data
- No visual regression testing (could be added with Playwright's screenshot comparison)
- No load or performance tests
