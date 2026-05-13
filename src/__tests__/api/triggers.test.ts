import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

const originalCronSecret = process.env.CRON_SECRET;

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
        })),
      })),
    })),
  })),
}));

describe("Triggers API", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJ-test-key";
  });

  afterAll(() => {
    if (originalCronSecret) process.env.CRON_SECRET = originalCronSecret;
    else delete process.env.CRON_SECRET;
  });

  it("GET returns triggers array", async () => {
    const { GET } = await import("@/app/api/notifications/triggers/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.triggers).toBeInstanceOf(Array);
  });

  it("POST returns 401 without auth", async () => {
    const { POST } = await import("@/app/api/notifications/triggers/route");
    const request = new Request("http://localhost/api/notifications/triggers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meeting_id: "test-id" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("POST returns 400 without meeting_id", async () => {
    const { POST } = await import("@/app/api/notifications/triggers/route");
    const request = new Request("http://localhost/api/notifications/triggers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer test-cron-secret",
      },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("meeting_id");
  });
});
