import { describe, it, expect, vi } from "vitest";

// Mock Anthropic
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: '{"subject":"Re: Test","body":"Hello"}' }],
        }),
      };
    },
  };
});

// Mock Supabase
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: vi.fn(() => ({
    from: mockFrom,
  })),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
process.env.ANTHROPIC_API_KEY = "test-key";

describe("Draft Email API", () => {
  it("rejects request without meetingId", async () => {
    const { POST } = await import("@/app/api/actions/draft-email/route");
    const request = new Request("http://localhost/api/actions/draft-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: "client_followup" }),
    });

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
  });

  it("rejects request with invalid template", async () => {
    const { POST } = await import("@/app/api/actions/draft-email/route");
    const request = new Request("http://localhost/api/actions/draft-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: "abc", template: "invalid_template" }),
    });

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
  });

  it("returns 404 when meeting not found", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

    const { POST } = await import("@/app/api/actions/draft-email/route");
    const request = new Request("http://localhost/api/actions/draft-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: "nonexistent", template: "client_followup" }),
    });

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(404);
  });

  it("returns email JSON for valid request", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        topic: "Q4 Review",
        host_name: "Tyler",
        company_name: "Acme Corp",
        primary_participant_name: "John",
        start_time: "2026-01-15T10:00:00Z",
        meeting_summary: "Discussed Q4 results",
        transcript_text: "Sample transcript...",
        meeting_score: {},
        rep_score: {},
        internal_summary: null,
        scoring_stage_type: "follow_up",
      },
      error: null,
    });

    const { POST } = await import("@/app/api/actions/draft-email/route");
    const request = new Request("http://localhost/api/actions/draft-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: "abc-123", template: "client_followup" }),
    });

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.subject).toBeTruthy();
    expect(data.body).toBeTruthy();
  });
});
