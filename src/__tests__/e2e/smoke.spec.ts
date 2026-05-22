import { test, expect } from "@playwright/test";

// Login helper - reused across tests
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', process.env.TEST_EMAIL ?? "neeraj@fullfunnel.co");
  await page.fill('input[type="password"]', process.env.TEST_PASSWORD ?? "testpass");
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 10000 });
}

test.describe("Authentication", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Prism");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("shows error on bad credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "bad@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Scorecard (Homepage)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("loads with KPI cards", async ({ page }) => {
    await expect(page.locator("text=Team Scorecard")).toBeVisible();
    await expect(page.locator("text=Total Meetings")).toBeVisible();
    await expect(page.locator("text=Avg Score")).toBeVisible();
    await expect(page.locator("text=At-Risk Accounts")).toBeVisible();
  });

  test("period filter exists", async ({ page }) => {
    await expect(page.locator("text=Period")).toBeVisible();
  });

  test("rep table loads", async ({ page }) => {
    await expect(page.locator("text=Rep")).toBeVisible();
    await expect(page.locator("text=Meetings")).toBeVisible();
  });
});

test.describe("Meeting Feed", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("loads with meeting cards", async ({ page }) => {
    await page.goto("/meetings");
    await expect(page.locator("text=Meeting Feed")).toBeVisible();
    // Should have at least one meeting card
    await expect(page.locator('[href^="/meetings/"]').first()).toBeVisible({ timeout: 10000 });
  });

  test("filters are present", async ({ page }) => {
    await page.goto("/meetings");
    await expect(page.locator("text=Rep")).toBeVisible();
    await expect(page.locator("text=Stage")).toBeVisible();
    await expect(page.locator("text=Sort")).toBeVisible();
  });
});

test.describe("Meeting Detail", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("clicking a meeting loads detail page", async ({ page }) => {
    await page.goto("/meetings");
    const firstMeeting = page.locator('[href^="/meetings/"]').first();
    await firstMeeting.click();
    await expect(page.locator("text=Scores")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Summary")).toBeVisible();
  });
});

test.describe("Companies", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("loads company cards with sort", async ({ page }) => {
    await page.goto("/companies");
    await expect(page.locator("text=Companies")).toBeVisible();
    await expect(page.locator("text=Sort by")).toBeVisible();
    // Should have at least one company card
    await expect(page.locator('[href^="/companies/"]').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Ask Blarney", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("loads with suggested prompts", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("text=Prism assistant")).toBeVisible();
    await expect(page.locator("text=Compare all reps")).toBeVisible();
  });
});

test.describe("System Health", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("loads pipeline sync and service status", async ({ page }) => {
    await page.goto("/health");
    await expect(page.locator("text=System Overview")).toBeVisible();
    await expect(page.locator("text=Pipeline Sync")).toBeVisible();
    await expect(page.locator("text=Service Status")).toBeVisible();
  });
});
