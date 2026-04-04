# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Meeting Feed >> filters are present
- Location: src/__tests__/e2e/smoke.spec.ts:68:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "FullFunnel" [ref=e5]
      - heading "Meeting Intelligence" [level=1] [ref=e6]
      - paragraph [ref=e7]: Sign in to your account
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: Email
        - textbox "you@fullfunnel.co" [ref=e11]: neeraj@fullfunnel.co
      - generic [ref=e12]:
        - generic [ref=e13]: Password
        - generic [ref=e14]:
          - textbox "Enter your password" [ref=e15]: testpass
          - button "Show password" [ref=e16]:
            - img [ref=e17]
      - paragraph [ref=e20]: Invalid login credentials
      - button "Sign In" [ref=e21]
    - paragraph [ref=e22]: Cross-call analysis at scale
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e28] [cursor=pointer]:
    - img [ref=e29]
  - alert [ref=e32]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | // Login helper — reused across tests
  4   | async function login(page: import("@playwright/test").Page) {
  5   |   await page.goto("/login");
  6   |   await page.fill('input[type="email"]', process.env.TEST_EMAIL ?? "neeraj@fullfunnel.co");
  7   |   await page.fill('input[type="password"]', process.env.TEST_PASSWORD ?? "testpass");
  8   |   await page.click('button[type="submit"]');
> 9   |   await page.waitForURL("/", { timeout: 10000 });
      |              ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  10  | }
  11  | 
  12  | test.describe("Authentication", () => {
  13  |   test("redirects unauthenticated users to login", async ({ page }) => {
  14  |     await page.goto("/");
  15  |     await expect(page).toHaveURL(/\/login/);
  16  |   });
  17  | 
  18  |   test("login page renders", async ({ page }) => {
  19  |     await page.goto("/login");
  20  |     await expect(page.locator("h1")).toContainText("Meeting Intelligence");
  21  |     await expect(page.locator('input[type="email"]')).toBeVisible();
  22  |     await expect(page.locator('input[type="password"]')).toBeVisible();
  23  |   });
  24  | 
  25  |   test("shows error on bad credentials", async ({ page }) => {
  26  |     await page.goto("/login");
  27  |     await page.fill('input[type="email"]', "bad@example.com");
  28  |     await page.fill('input[type="password"]', "wrongpassword");
  29  |     await page.click('button[type="submit"]');
  30  |     await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 5000 });
  31  |   });
  32  | });
  33  | 
  34  | test.describe("Scorecard (Homepage)", () => {
  35  |   test.beforeEach(async ({ page }) => {
  36  |     await login(page);
  37  |   });
  38  | 
  39  |   test("loads with KPI cards", async ({ page }) => {
  40  |     await expect(page.locator("text=Team Scorecard")).toBeVisible();
  41  |     await expect(page.locator("text=Total Meetings")).toBeVisible();
  42  |     await expect(page.locator("text=Avg Score")).toBeVisible();
  43  |     await expect(page.locator("text=At-Risk Accounts")).toBeVisible();
  44  |   });
  45  | 
  46  |   test("period filter exists", async ({ page }) => {
  47  |     await expect(page.locator("text=Period")).toBeVisible();
  48  |   });
  49  | 
  50  |   test("rep table loads", async ({ page }) => {
  51  |     await expect(page.locator("text=Rep")).toBeVisible();
  52  |     await expect(page.locator("text=Meetings")).toBeVisible();
  53  |   });
  54  | });
  55  | 
  56  | test.describe("Meeting Feed", () => {
  57  |   test.beforeEach(async ({ page }) => {
  58  |     await login(page);
  59  |   });
  60  | 
  61  |   test("loads with meeting cards", async ({ page }) => {
  62  |     await page.goto("/meetings");
  63  |     await expect(page.locator("text=Meeting Feed")).toBeVisible();
  64  |     // Should have at least one meeting card
  65  |     await expect(page.locator('[href^="/meetings/"]').first()).toBeVisible({ timeout: 10000 });
  66  |   });
  67  | 
  68  |   test("filters are present", async ({ page }) => {
  69  |     await page.goto("/meetings");
  70  |     await expect(page.locator("text=Rep")).toBeVisible();
  71  |     await expect(page.locator("text=Stage")).toBeVisible();
  72  |     await expect(page.locator("text=Sort")).toBeVisible();
  73  |   });
  74  | });
  75  | 
  76  | test.describe("Meeting Detail", () => {
  77  |   test.beforeEach(async ({ page }) => {
  78  |     await login(page);
  79  |   });
  80  | 
  81  |   test("clicking a meeting loads detail page", async ({ page }) => {
  82  |     await page.goto("/meetings");
  83  |     const firstMeeting = page.locator('[href^="/meetings/"]').first();
  84  |     await firstMeeting.click();
  85  |     await expect(page.locator("text=Scores")).toBeVisible({ timeout: 10000 });
  86  |     await expect(page.locator("text=Summary")).toBeVisible();
  87  |   });
  88  | });
  89  | 
  90  | test.describe("Companies", () => {
  91  |   test.beforeEach(async ({ page }) => {
  92  |     await login(page);
  93  |   });
  94  | 
  95  |   test("loads company cards with sort", async ({ page }) => {
  96  |     await page.goto("/companies");
  97  |     await expect(page.locator("text=Companies")).toBeVisible();
  98  |     await expect(page.locator("text=Sort by")).toBeVisible();
  99  |     // Should have at least one company card
  100 |     await expect(page.locator('[href^="/companies/"]').first()).toBeVisible({ timeout: 10000 });
  101 |   });
  102 | });
  103 | 
  104 | test.describe("Ask Blarney", () => {
  105 |   test.beforeEach(async ({ page }) => {
  106 |     await login(page);
  107 |   });
  108 | 
  109 |   test("loads with suggested prompts", async ({ page }) => {
```