import { describe, it, expect, vi } from "vitest";

// Mock dependencies before importing
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = {
        stream: vi.fn().mockReturnValue({
          toReadableStream: () => new ReadableStream(),
        }),
      };
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: vi.fn(() => ({
    rpc: vi.fn().mockResolvedValue({ data: [] }),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          ascending: vi.fn().mockResolvedValue({ data: [] }),
        }),
        in: vi.fn().mockResolvedValue({ data: [] }),
      }),
    }),
  })),
}));

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
