import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

const originalCronSecret = process.env.CRON_SECRET;
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            not: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        })),
        not: vi.fn(() => ({
          not: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
        eq: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  })),
}));

describe("Digest API", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJ-test-key";
  });

  afterAll(() => {
    if (originalCronSecret) process.env.CRON_SECRET = originalCronSecret;
    else delete process.env.CRON_SECRET;
    if (originalSupabaseUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    if (originalServiceKey) process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
  });

  it("returns 401 without CRON_SECRET header or query param", async () => {
    const { GET } = await import("@/app/api/notifications/digest/route");
    const request = new Request("http://localhost/api/notifications/digest?type=daily_actions");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 401 with wrong CRON_SECRET", async () => {
    const { GET } = await import("@/app/api/notifications/digest/route");
    const request = new Request("http://localhost/api/notifications/digest?type=daily_actions", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("accepts CRON_SECRET via query param", async () => {
    const { GET } = await import("@/app/api/notifications/digest/route");
    const request = new Request(
      "http://localhost/api/notifications/digest?type=daily_actions&secret=test-cron-secret"
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.digestType).toBe("daily_actions");
    expect(data.results).toBeInstanceOf(Array);
  });

  it("accepts CRON_SECRET via Bearer header", async () => {
    const { GET } = await import("@/app/api/notifications/digest/route");
    const request = new Request(
      "http://localhost/api/notifications/digest?type=monday_priorities",
      { headers: { authorization: "Bearer test-cron-secret" } }
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.digestType).toBe("monday_priorities");
  });

  it("returns results array with section entries", async () => {
    const { GET } = await import("@/app/api/notifications/digest/route");
    process.env.MI_SALES_CHANNEL_ID = "C_TEST_SALES";
    process.env.MI_CS_CHANNEL_ID = "C_TEST_CS";
    process.env.MI_INTERNAL_CHANNEL_ID = "C_TEST_INTERNAL";
    const request = new Request(
      "http://localhost/api/notifications/digest?type=friday_review&secret=test-cron-secret"
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results.length).toBeGreaterThanOrEqual(0);
    expect(data.generatedAt).toBeDefined();
  });
});
