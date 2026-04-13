import { describe, it, expect, vi } from "vitest";

// Mock dependencies before importing
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = {
        stream: vi.fn().mockReturnValue({
          withResponse: vi.fn().mockResolvedValue({ response: new Response(), request_id: null }),
          toReadableStream: () => new ReadableStream(),
        }),
      };
    },
  };
});

vi.mock("@/lib/supabase/server", () => {
  const chainable = () => {
    const obj: Record<string, unknown> = {};
    const proxy = new Proxy(obj, {
      get(_target, prop) {
        if (prop === "then") return undefined; // Not a thenable
        if (prop === "data") return [];
        if (prop === "count") return 0;
        return vi.fn().mockReturnValue(proxy);
      },
    });
    return proxy;
  };
  return {
    createServerSupabase: vi.fn(() => ({
      rpc: vi.fn().mockResolvedValue({ data: [] }),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
          in: vi.fn().mockResolvedValue({ data: [] }),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ count: 0 }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({ then: (resolve: () => void) => resolve() }),
      }),
    })),
  };
});

// Set env vars
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
process.env.ANTHROPIC_API_KEY = "test-anthropic-key";

describe("Chat API route", () => {
  it("validates message is required", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "", history: [] }),
    });

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Message is required");
  });

  it("accepts valid request with message", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Compare all reps", history: [] }),
    });

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    // Should return streaming response (200)
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });
});

describe("Chat API validation", () => {
  it("rejects empty message string", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "", history: [] }),
    });

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
  });
});
