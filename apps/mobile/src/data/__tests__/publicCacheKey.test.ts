import { describe, expect, it, vi } from "vitest";

vi.mock("../../utils/env", () => ({ getBffBaseUrl: () => "https://api.example.test" }));

describe("public cache keys", () => {
  it("includes the endpoint base URL and stable query ordering", async () => {
    const { getPublicCacheKey } = await import("../publicCacheKey");
    expect(getPublicCacheKey("events", { search: "choir", from: "2026-07-10" })).toBe("public:https://api.example.test:events?from=2026-07-10&search=choir");
  });

  it("does not append a separator for an empty query", async () => {
    const { getPublicCacheKey } = await import("../publicCacheKey");
    expect(getPublicCacheKey("rooms", {})).toBe("public:https://api.example.test:rooms");
  });
});
