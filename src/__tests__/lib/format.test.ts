import { describe, it, expect } from "vitest";
import { formatScore, formatDate, formatDateTime, formatRelativeDate, formatDuration } from "@/lib/utils/format";

describe("formatScore", () => {
  it("formats a number to one decimal", () => {
    expect(formatScore(7.85)).toBe("7.8");
    expect(formatScore(8.15)).toBe("8.2");
    expect(formatScore(9.99)).toBe("10.0");
  });

  it("returns dash for null", () => {
    expect(formatScore(null)).toBe("-");
  });

  it("handles zero", () => {
    expect(formatScore(0)).toBe("0.0");
  });

  it("handles whole numbers", () => {
    expect(formatScore(8)).toBe("8.0");
  });

  it("respects custom decimal places", () => {
    expect(formatScore(7.856, 2)).toBe("7.86");
  });
});

describe("formatDate", () => {
  it("formats an ISO date string to MMM d, yyyy", () => {
    expect(formatDate("2026-01-15T10:00:00Z")).toBe("Jan 15, 2026");
  });

  it("returns dash for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("returns dash for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("-");
  });
});

describe("formatDateTime", () => {
  it("formats with time", () => {
    const result = formatDateTime("2026-03-20T14:30:00Z");
    expect(result).toContain("2026");
    expect(result).toContain("Mar");
    expect(result).not.toBe("-");
  });

  it("returns dash for null", () => {
    expect(formatDateTime(null)).toBe("-");
  });
});

describe("formatRelativeDate", () => {
  it("returns a relative string for valid date", () => {
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const result = formatRelativeDate(recent);
    expect(result).toContain("ago");
  });

  it("returns dash for null", () => {
    expect(formatRelativeDate(null)).toBe("-");
  });
});

describe("formatDuration", () => {
  it("formats minutes under 60", () => {
    expect(formatDuration(45)).toBe("45m");
  });

  it("formats exact hours", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(120)).toBe("2h");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(135)).toBe("2h 15m");
  });

  it("handles null", () => {
    expect(formatDuration(null)).toBe("-");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0m");
  });
});
