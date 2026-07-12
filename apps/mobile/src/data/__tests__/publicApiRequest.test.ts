import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { getCachedJson } from "../publicApiRequest";
import { clearPersistedCache, setPersistedCache } from "../persistedCache";
import { getPublicCacheKey } from "../publicCacheKey";
import { _resetBffBaseUrlMemoForTests } from "../../utils/bffConfig";

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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify({ value: 1 }), headers: { get: () => "example" } }));
    const result = await getCachedJson("/test", z.object({ value: z.number() }), "test", { offlineMode: true });
    expect(result).toMatchObject({ data: { value: 1 }, source: "network", cacheAge: null });
  });

  it("labels the rendered persisted fallback with its own age", async () => {
    await setPersistedCache(getPublicCacheKey("test"), { value: 2 });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    const result = await getCachedJson("/test", z.object({ value: z.number() }), "test", { offlineMode: true });
    expect(result.source).toBe("persisted-cache");
    expect(result.cacheAge).toBeGreaterThanOrEqual(0);
    expect(result.data.value).toBe(2);
  });
});
