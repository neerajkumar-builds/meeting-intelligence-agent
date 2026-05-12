import { describe, it, expect, vi } from "vitest";

const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
const mockNot2 = vi.fn().mockReturnValue({ order: mockOrder });
const mockNot = vi.fn().mockReturnValue({ not: mockNot2 });
const mockEq = vi.fn().mockReturnValue({ not: mockNot });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: vi.fn(() => ({
    from: () => ({ select: mockSelect }),
  })),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";

describe("Coaching API", () => {
  it("returns null coaching for rep with no data", async () => {
    const { GET } = await import("@/app/api/reps/[name]/coaching/route");
    const request = new Request("http://localhost/api/reps/Tyler/coaching");
    const params = Promise.resolve({ name: "Tyler" });

    const response = await GET(
      request as unknown as Parameters<typeof GET>[0],
      { params } as unknown as Parameters<typeof GET>[1]
    );
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.coaching).toBeNull();
  });

  it("excludes internal meetings from query (CR-004)", async () => {
    mockNot.mockClear();
    const { GET } = await import("@/app/api/reps/[name]/coaching/route");
    const request = new Request("http://localhost/api/reps/Tyler/coaching");
    const params = Promise.resolve({ name: "Tyler" });

    await GET(
      request as unknown as Parameters<typeof GET>[0],
      { params } as unknown as Parameters<typeof GET>[1]
    );

    expect(mockNot).toHaveBeenCalledWith("scoring_stage_type", "in", "(internal,internal_client_meeting)");
  });
});
