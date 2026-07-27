/** Verifies cache provenance, timestamps, and degraded-state metadata returned by public requests. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { getCachedJson } from "../publicApiRequest";
import { clearPersistedCache, setPersistedCache } from "../persistedCache";
import { getPublicCacheKey } from "../publicCacheKey";
import { _resetBffBaseUrlMemoForTests } from "../../utils/bffConfig";
import { jsonResponse } from "../../test/httpResponse";

describe("resource metadata", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "http://localhost:4000";
    _resetBffBaseUrlMemoForTests();
  });
  afterEach(async () => {
    vi.unstubAllGlobals();
    await clearPersistedCache();
    delete process.env.EXPO_PUBLIC_BFF_BASE_URL;
  });

  it("labels fresh network data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ value: 1 }, 200, () => "example")));
    const result = await getCachedJson("/test", z.object({ value: z.number() }), "test", { offlineMode: true });
    expect(result).toMatchObject({ data: { value: 1 }, source: "network", cacheAge: null });
  });

  it("does not append a trailing question mark for an empty query", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ value: 1 }, 200, () => "example"));
    vi.stubGlobal("fetch", fetch);

    await getCachedJson("/test", z.object({ value: z.number() }), "test", { offlineMode: true, queryParams: {} });

    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/test", expect.any(Object));
  });

  it("labels the rendered persisted fallback with its own age", async () => {
    await setPersistedCache(getPublicCacheKey("test"), { value: 2 });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    const result = await getCachedJson("/test", z.object({ value: z.number() }), "test", { offlineMode: true });
    expect(result.source).toBe("persisted-cache");
    expect(result.cacheAge).toBeGreaterThanOrEqual(0);
    expect(result.data.value).toBe(2);
  });

  it("rejects an incompatible persisted payload instead of rendering it offline", async () => {
    await setPersistedCache(getPublicCacheKey("test"), { value: "old shape" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(getCachedJson("/test", z.object({ value: z.number() }), "test", { offlineMode: true }))
      .rejects.toThrow("offline");
  });
});
