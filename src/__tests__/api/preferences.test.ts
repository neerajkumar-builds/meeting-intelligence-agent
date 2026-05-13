import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
  })),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
    })),
  })),
}));

describe("Notification Preferences API", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ-test-anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJ-test-service";
  });

  it("GET returns 401 when user not authenticated", async () => {
    const { GET } = await import("@/app/api/notifications/preferences/route");
    const response = await GET();
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("PUT returns 401 when user not authenticated", async () => {
    const { PUT } = await import("@/app/api/notifications/preferences/route");
    const request = new Request("http://localhost/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "sales", channel: "slack" }),
    });
    const response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it("PUT returns 400 when section missing", async () => {
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: vi.fn(() => ({
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({ data: { user: { email: "test@test.com" } }, error: null })
          ),
        },
      })),
    }));

    const { PUT } = await import("@/app/api/notifications/preferences/route");
    const request = new Request("http://localhost/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "slack" }),
    });
    const response = await PUT(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("section");
  });
});
