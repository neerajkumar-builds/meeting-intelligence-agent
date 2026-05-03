import { describe, it, expect } from "vitest";
import {
  STAGE_CONFIG,
  SCORE_BANDS,
  getScoreBand,
  NAV_ITEMS,
  SECTION_PROMPTS,
  TRACKED_VENDORS,
} from "@/lib/constants";

describe("STAGE_CONFIG", () => {
  it("has all 4 stage types", () => {
    expect(Object.keys(STAGE_CONFIG)).toEqual([
      "discovery_scoping",
      "follow_up",
      "onboarding",
      "internal",
    ]);
  });

  it("each stage has required fields", () => {
    for (const config of Object.values(STAGE_CONFIG)) {
      expect(config.label).toBeTruthy();
      expect(config.color).toBeTruthy();
      expect(config.bgClass).toContain("bg-");
      expect(config.darkBgClass).toContain("dark:");
    }
  });
});

describe("getScoreBand", () => {
  it("returns high for 8+", () => {
    expect(getScoreBand(8)).toEqual(SCORE_BANDS.high);
    expect(getScoreBand(10)).toEqual(SCORE_BANDS.high);
    expect(getScoreBand(8.5)).toEqual(SCORE_BANDS.high);
  });

  it("returns medium for 6-7.9", () => {
    expect(getScoreBand(6)).toEqual(SCORE_BANDS.medium);
    expect(getScoreBand(7.9)).toEqual(SCORE_BANDS.medium);
  });

  it("returns low for below 6", () => {
    expect(getScoreBand(5.9)).toEqual(SCORE_BANDS.low);
    expect(getScoreBand(0)).toEqual(SCORE_BANDS.low);
    expect(getScoreBand(3)).toEqual(SCORE_BANDS.low);
  });

  it("returns null for null", () => {
    expect(getScoreBand(null)).toBeNull();
  });
});

describe("NAV_ITEMS", () => {
  it("has 6 navigation items", () => {
    expect(NAV_ITEMS).toHaveLength(6);
  });

  it("first item is Scorecard at /", () => {
    expect(NAV_ITEMS[0]).toEqual({
      label: "Scorecard",
      href: "/",
      icon: "LayoutDashboard",
      group: "Analysis",
    });
  });

  it("each item has label, href, and icon", () => {
    for (const item of NAV_ITEMS) {
      expect(item.label).toBeTruthy();
      expect(item.href).toBeTruthy();
      expect(item.icon).toBeTruthy();
    }
  });

  it("all routes start with /", () => {
    for (const item of NAV_ITEMS) {
      expect(item.href.startsWith("/")).toBe(true);
    }
  });
});

describe("SECTION_PROMPTS", () => {
  it("has prompts for each section", () => {
    for (const prompts of Object.values(SECTION_PROMPTS)) {
      expect(prompts.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("each prompt is a non-empty string", () => {
    for (const prompts of Object.values(SECTION_PROMPTS)) {
      for (const prompt of prompts) {
        expect(typeof prompt).toBe("string");
        expect(prompt.length).toBeGreaterThan(10);
      }
    }
  });
});

describe("TRACKED_VENDORS", () => {
  it("includes major competitors", () => {
    expect(TRACKED_VENDORS).toContain("Gong");
    expect(TRACKED_VENDORS).toContain("Salesloft");
    expect(TRACKED_VENDORS).toContain("Apollo");
    expect(TRACKED_VENDORS).toContain("ZoomInfo");
  });

  it("includes FullFunnel partner tools", () => {
    expect(TRACKED_VENDORS).toContain("HubSpot");
    expect(TRACKED_VENDORS).toContain("Clay");
    expect(TRACKED_VENDORS).toContain("HeyReach");
    expect(TRACKED_VENDORS).toContain("Instantly");
  });

  it("has no empty strings", () => {
    for (const v of TRACKED_VENDORS) {
      expect(v.length).toBeGreaterThan(0);
    }
  });
});
