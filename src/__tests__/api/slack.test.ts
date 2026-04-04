import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// Store original env
const originalEnv = process.env.SLACK_WEBHOOK_URL;

describe("Slack Notification API", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 503 when SLACK_WEBHOOK_URL is not set", async () => {
    delete process.env.SLACK_WEBHOOK_URL;
    const { POST } = await import("@/app/api/notifications/slack/route");
    const request = new Request("http://localhost/api/notifications/slack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", body: "Test body" }),
    });

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toContain("not configured");
  });

  it("returns 400 when title is missing", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
    const { POST } = await import("@/app/api/notifications/slack/route");
    const request = new Request("http://localhost/api/notifications/slack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Test body" }),
    });

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
  });

  it("returns 400 when body is missing", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
    const { POST } = await import("@/app/api/notifications/slack/route");
    const request = new Request("http://localhost/api/notifications/slack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
  });

  // Restore env
  afterAll(() => {
    if (originalEnv) process.env.SLACK_WEBHOOK_URL = originalEnv;
  });
});
