import { describe, it, expect } from "vitest";
import { getRepPerformanceScore } from "@/types/scores";

describe("getRepPerformanceScore", () => {
  it("extracts rep_performance_score from valid object", () => {
    expect(getRepPerformanceScore({ rep_performance_score: 8.5 })).toBe(8.5);
  });

  it("returns null for null input", () => {
    expect(getRepPerformanceScore(null)).toBeNull();
  });

  it("returns null for non-object", () => {
    expect(getRepPerformanceScore("not an object")).toBeNull();
  });

  it("returns null when score field is missing", () => {
    expect(getRepPerformanceScore({ other_field: 5 })).toBeNull();
  });
});
