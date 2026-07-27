/** Verifies cache keys isolate API origins, institutions, endpoints, and canonical filters. */
import { beforeEach, describe, expect, it } from "vitest";
import { getPublicCacheKey, PUBLIC_CACHE_SCHEMA_VERSION } from "../publicCacheKey";
import { _resetBffBaseUrlMemoForTests } from "../../utils/bffConfig";

describe("getPublicCacheKey", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "https://api.example.test";
    _resetBffBaseUrlMemoForTests();
  });

  it("partitions public data by cache schema version and configured institution", () => {
    const key = getPublicCacheKey("events", { campus: "north" });
    expect(key).toContain(`public:v${PUBLIC_CACHE_SCHEMA_VERSION}:https://api.example.test:example:events`);
    expect(key).toContain("campus=north");
  });

  it("encodes query values so distinct filters cannot share a cache key", () => {
    const embeddedSeparator = getPublicCacheKey("events", { search: "x&to=y" });
    const separateParameter = getPublicCacheKey("events", { search: "x", to: "y" });

    expect(embeddedSeparator).toContain("search=x%26to%3Dy");
    expect(embeddedSeparator).not.toBe(separateParameter);
  });
});
