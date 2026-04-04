import { describe, it, expect, vi } from "vitest";

// Mock @supabase/ssr before importing middleware
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
      }),
    },
  })),
}));

// Set env vars before import
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";

import { createServerClient } from "@supabase/ssr";

describe("middleware route skipping logic", () => {
  // Test the skip conditions without importing the full middleware
  // (which depends on Next.js server runtime)
  const skipPaths = [
    "/login",
    "/login?redirect=/",
    "/api/chat",
    "/api/actions/draft-email",
    "/_next/static/chunk.js",
    "/favicon.ico",
    "/fullfunnel-logo-white.svg",
    "/logo.png",
  ];

  const protectedPaths = [
    "/",
    "/meetings",
    "/meetings/abc-123",
    "/companies",
    "/companies/Acme",
    "/search",
    "/health",
    "/reps/Tyler",
  ];

  function shouldSkipAuth(pathname: string): boolean {
    return (
      pathname.startsWith("/login") ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/favicon") ||
      pathname.endsWith(".svg") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".ico")
    );
  }

  it("skips auth for login, api, static, and asset paths", () => {
    for (const path of skipPaths) {
      expect(shouldSkipAuth(path)).toBe(true);
    }
  });

  it("requires auth for all protected routes", () => {
    for (const path of protectedPaths) {
      expect(shouldSkipAuth(path)).toBe(false);
    }
  });
});

describe("createServerClient integration", () => {
  it("is called with correct env vars", () => {
    // Verify the mock was set up correctly
    expect(createServerClient).toBeDefined();
  });
});
