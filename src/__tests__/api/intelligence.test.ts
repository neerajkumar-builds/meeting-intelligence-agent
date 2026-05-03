import { describe, it, expect, vi } from "vitest";

// Mock Supabase
const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
const mockEq = vi.fn().mockReturnValue({ or: mockOr, order: mockOrder });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
const mockIlike = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [] }) });

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: vi.fn(() => ({
    from: (table: string) => {
      if (table === "meeting_chunks") {
        return { select: vi.fn().mockReturnValue({ ilike: mockIlike }) };
      }
      return { select: mockSelect };
    },
  })),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";

describe("Intelligence API", () => {
  it("returns valid CompanyIntelligence shape for empty data", async () => {
    const { GET } = await import("@/app/api/companies/[name]/intelligence/route");
    const request = new Request("http://localhost/api/companies/Acme/intelligence");
    const params = Promise.resolve({ name: "Acme" });

    const response = await GET(
      request as unknown as Parameters<typeof GET>[0],
      { params } as unknown as Parameters<typeof GET>[1]
    );
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.companyName).toBe("Acme");
    expect(data.generatedAt).toBeTruthy();

    // All 7 sections present
    expect(data.healthPulse).toBeDefined();
    expect(data.healthPulse.trend).toBe("insufficient_data");
    expect(data.stakeholders).toEqual([]);
    expect(data.dealStatus).toBeNull();
    expect(data.riskSignals).toBeDefined();
    expect(data.riskSignals.churnSignals).toEqual([]);
    expect(data.openActionItems).toEqual([]);
    expect(data.competitorMentions).toBeDefined();
    expect(data.meddicGaps).toBeDefined();
    expect(data.meddicGaps.dimensions).toHaveLength(6);
    expect(data.meddicGaps.overallCoverage).toBe(0);
  });
});

describe("Internal meeting exclusion (CR-004)", () => {
  it("excludes internal meetings from query", async () => {
    mockOr.mockClear();
    const { GET } = await import("@/app/api/companies/[name]/intelligence/route");
    const request = new Request("http://localhost/api/companies/Acme/intelligence");
    const params = Promise.resolve({ name: "Acme" });

    await GET(
      request as unknown as Parameters<typeof GET>[0],
      { params } as unknown as Parameters<typeof GET>[1]
    );

    expect(mockOr).toHaveBeenCalledWith("scoring_stage_type.neq.internal,scoring_stage_type.is.null");
  });
});

describe("MEDDIC gap analysis structure", () => {
  it("has all 6 MEDDIC dimensions", async () => {
    const { GET } = await import("@/app/api/companies/[name]/intelligence/route");
    const request = new Request("http://localhost/api/companies/TestCo/intelligence");
    const params = Promise.resolve({ name: "TestCo" });

    const response = await GET(
      request as unknown as Parameters<typeof GET>[0],
      { params } as unknown as Parameters<typeof GET>[1]
    );
    const data = await response.json();

    const keys = data.meddicGaps.dimensions.map((d: { key: string }) => d.key);
    expect(keys).toContain("metrics");
    expect(keys).toContain("economic_buyer");
    expect(keys).toContain("decision_criteria");
    expect(keys).toContain("decision_process");
    expect(keys).toContain("identify_pain");
    expect(keys).toContain("champion");
  });
});
