import { describe, it, expect } from "vitest";

describe("Vitest setup", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("resolves path aliases", async () => {
    const { STAGE_CONFIG } = await import("@/lib/constants");
    expect(STAGE_CONFIG).toBeDefined();
    expect(STAGE_CONFIG.discovery_scoping).toBeDefined();
  });
});
