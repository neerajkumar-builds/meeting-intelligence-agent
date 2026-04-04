import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { SyncIndicator } from "@/components/shared/sync-indicator";

// Mock the hook
vi.mock("@/lib/hooks/use-sync-status", () => ({
  useSyncStatus: vi.fn().mockReturnValue({
    data: {
      lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      hoursAgo: 2,
      pendingCount: 0,
      status: "fresh",
      nextSyncEstimate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    },
    isLoading: false,
  }),
}));

describe("SyncIndicator", () => {
  it("renders synced time", () => {
    const { container } = render(<SyncIndicator />);
    expect(container.textContent).toContain("Synced");
    expect(container.textContent).toContain("2h ago");
  });

  it("links to /health", () => {
    const { container } = render(<SyncIndicator />);
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/health");
  });
});
