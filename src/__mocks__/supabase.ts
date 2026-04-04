import { vi } from "vitest";

// Chainable mock that returns itself for .from().select().order().limit() etc.
function createChainableMock() {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};
  const chain = new Proxy(mock, {
    get(target, prop) {
      if (typeof prop === "string") {
        if (!target[prop]) {
          target[prop] = vi.fn().mockReturnValue(
            new Proxy({}, {
              get(_, innerProp) {
                if (innerProp === "then") return undefined; // not a promise
                return vi.fn().mockReturnValue(
                  Promise.resolve({ data: [], error: null, count: 0 })
                );
              },
            })
          );
        }
        return target[prop];
      }
      return undefined;
    },
  });
  return chain;
}

export const supabase = createChainableMock();

vi.mock("@/lib/supabase/client", () => ({
  supabase: createChainableMock(),
}));
