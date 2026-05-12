import { describe, it, expect } from "vitest";
import { getStageLabel, getStageColor, getStageBgClass, STAGE_SCORE_FIELDS } from "@/lib/utils/stage";

describe("getStageLabel", () => {
  it("maps all known stages", () => {
    expect(getStageLabel("discovery_scoping")).toBe("Discovery");
    expect(getStageLabel("follow_up")).toBe("Follow-Up");
    expect(getStageLabel("onboarding")).toBe("Onboarding");
    expect(getStageLabel("client_meeting")).toBe("Check-In");
    expect(getStageLabel("internal_client_meeting")).toBe("Internal Check-In");
    expect(getStageLabel("internal")).toBe("Internal");
  });

  it("returns Unknown for null", () => {
    expect(getStageLabel(null)).toBe("Unknown");
  });

  it("returns Unknown for unrecognized stage", () => {
    expect(getStageLabel("nonexistent_stage")).toBe("Unknown");
  });
});

describe("getStageColor", () => {
  it("returns correct colors", () => {
    expect(getStageColor("discovery_scoping")).toBe("blue");
    expect(getStageColor("follow_up")).toBe("slate");
    expect(getStageColor("onboarding")).toBe("blue");
    expect(getStageColor("client_meeting")).toBe("teal");
    expect(getStageColor("internal_client_meeting")).toBe("amber");
    expect(getStageColor("internal")).toBe("gray");
  });

  it("returns gray for null", () => {
    expect(getStageColor(null)).toBe("gray");
  });
});

describe("getStageBgClass", () => {
  it("returns Tailwind classes for known stages", () => {
    const result = getStageBgClass("discovery_scoping");
    expect(result).toContain("bg-");
    expect(result).toContain("dark:");
  });

  it("returns gray classes for null", () => {
    const result = getStageBgClass(null);
    expect(result).toContain("bg-gray");
  });
});

describe("STAGE_SCORE_FIELDS", () => {
  it("defines fields for all 6 stage types", () => {
    expect(STAGE_SCORE_FIELDS.discovery_scoping).toHaveLength(3);
    expect(STAGE_SCORE_FIELDS.follow_up).toHaveLength(3);
    expect(STAGE_SCORE_FIELDS.onboarding).toHaveLength(3);
    expect(STAGE_SCORE_FIELDS.client_meeting).toHaveLength(3);
    expect(STAGE_SCORE_FIELDS.internal_client_meeting).toHaveLength(1);
    expect(STAGE_SCORE_FIELDS.internal).toHaveLength(1);
  });

  it("each field has field and label", () => {
    for (const fields of Object.values(STAGE_SCORE_FIELDS)) {
      for (const f of fields) {
        expect(f.field).toBeTruthy();
        expect(f.label).toBeTruthy();
      }
    }
  });
});
