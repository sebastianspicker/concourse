/** Verifies persisted envelopes validate, expire, and retain offline fallback metadata. */
import { afterEach, describe, expect, it, vi } from "vitest";

const asyncStorageMock = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    failSet: false,
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      if (asyncStorageMock.failSet) throw new Error("storage write failed");
      values.set(key, value);
    },
    removeItem: async (key: string) => { values.delete(key); },
    getAllKeys: async () => [...values.keys()],
    multiRemove: async (keys: readonly string[]) => { for (const key of keys) values.delete(key); }
  };
});

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: asyncStorageMock,
}));

import {
  OFFLINE_CACHE_MAX_AGE_MS,
  getPersistedCache,
  setPersistedCache,
  clearPersistedCache,
  fetchNetworkFirstWithFallback,
  getCacheStats,
  isCacheStale,
} from "../persistedCache";
import { ApiErrorException } from "../../api/errors";

const failingNetworkLoad = async (): Promise<never> => {
  throw new TypeError("network error");
};

describe("persistedCache", () => {
  afterEach(async () => {
    vi.useRealTimers();
    asyncStorageMock.failSet = false;
    await clearPersistedCache();
    asyncStorageMock.values.clear();
  });

  it("stores and retrieves data", async () => {
    await setPersistedCache("test-key", { items: [1, 2, 3] });
    const result = await getPersistedCache<{ items: number[] }>("test-key");
    expect(result).toEqual({ items: [1, 2, 3] });
  });

  it("returns null for missing keys", async () => {
    const result = await getPersistedCache<string>("nonexistent");
    expect(result).toBeNull();
  });

  it("migrates a valid legacy cache entry after the new namespace is absent", async () => {
    const legacyKey = "campus-app-kit:migration-key";
    const currentKey = "concourse:migration-key";
    asyncStorageMock.values.set(legacyKey, JSON.stringify({ data: "legacy", timestamp: Date.now() }));

    expect(await getPersistedCache<string>("migration-key")).toBe("legacy");
    expect(asyncStorageMock.values.get(currentKey)).toContain('"legacy"');
    expect(asyncStorageMock.values.has(legacyKey)).toBe(false);
  });

  it("keeps the current namespace value when both cache namespaces exist", async () => {
    await setPersistedCache("new-wins", "current");
    asyncStorageMock.values.set(
      "campus-app-kit:new-wins",
      JSON.stringify({ data: "legacy", timestamp: Date.now() }),
    );

    expect(await getPersistedCache<string>("new-wins")).toBe("current");
    expect(asyncStorageMock.values.has("campus-app-kit:new-wins")).toBe(true);
  });

  it("preserves a legacy cache entry when migration cannot write the new key", async () => {
    const legacyKey = "campus-app-kit:write-failure";
    asyncStorageMock.values.set(legacyKey, JSON.stringify({ data: "legacy", timestamp: Date.now() }));
    asyncStorageMock.failSet = true;

    expect(await getPersistedCache<string>("write-failure")).toBe("legacy");
    expect(asyncStorageMock.values.has(legacyKey)).toBe(true);
    expect(asyncStorageMock.values.has("concourse:write-failure")).toBe(false);
  });

  it("clears a specific key", async () => {
    await setPersistedCache("key-a", "a");
    await setPersistedCache("key-b", "b");
    await clearPersistedCache("key-a");
    expect(await getPersistedCache("key-a")).toBeNull();
    expect(await getPersistedCache("key-b")).toBe("b");
  });

  it("clears all keys", async () => {
    await setPersistedCache("key-1", 1);
    await setPersistedCache("key-2", 2);
    await clearPersistedCache();
    expect(await getPersistedCache("key-1")).toBeNull();
    expect(await getPersistedCache("key-2")).toBeNull();
  });

  it("reports stale cache correctly", async () => {
    await setPersistedCache("stale-test", "data");
    // Just set, so it shouldn't be stale with a 1-hour window
    expect(await isCacheStale("stale-test", 3600000)).toBe(false);
    // Missing key is always stale
    expect(await isCacheStale("nonexistent", 3600000)).toBe(true);
  });

  it("rejects entries dated beyond the permitted clock skew", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-20T12:00:00.000Z"));
    await setPersistedCache("future-key", "data");

    vi.setSystemTime(new Date("2026-04-20T00:00:00.000Z"));
    expect(await getPersistedCache("future-key")).toBeNull();
  });
});

describe("fetchNetworkFirstWithFallback", () => {
  afterEach(async () => {
    asyncStorageMock.failSet = false;
    await clearPersistedCache();
  });

  it("returns fresh data on success", async () => {
    const result = await fetchNetworkFirstWithFallback("online-key", async () => ({
      value: "fresh",
    }));
    expect(result.data).toEqual({ value: "fresh" });
    expect(result.fromCache).toBe(false);
    expect(result.isOffline).toBe(false);
  });

  it("caches data after successful fetch", async () => {
    await fetchNetworkFirstWithFallback("cached-key", async () => "stored");
    const cached = await getPersistedCache<string>("cached-key");
    expect(cached).toBe("stored");
  });

  it("falls back to cache on a transient network failure", async () => {
    // First: populate cache
    await setPersistedCache("fallback-key", { items: ["cached"] });

    // Second: loader fails
    const result = await fetchNetworkFirstWithFallback<{ items: string[] }>(
      "fallback-key",
      failingNetworkLoad,
    );
    expect(result.data).toEqual({ items: ["cached"] });
    expect(result.fromCache).toBe(true);
    expect(result.isOffline).toBe(true);
    expect(result.cacheAge).toBeGreaterThanOrEqual(0);
  });

  it("returns valid cached data when the offline-marker write fails", async () => {
    await setPersistedCache("read-only-cache", { items: ["cached"] });
    asyncStorageMock.failSet = true;

    const result = await fetchNetworkFirstWithFallback("read-only-cache", failingNetworkLoad);

    expect(result.data).toEqual({ items: ["cached"] });
    expect(result.fromCache).toBe(true);
  });

  it("rejects stale cache on network failure", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-20T00:00:00.000Z"));
    await setPersistedCache("expired-key", { items: ["stale"] });

    vi.setSystemTime(new Date("2026-04-21T00:00:00.001Z"));

    await expect(
      fetchNetworkFirstWithFallback("expired-key", async () => {
        throw new TypeError("offline");
      })
    ).rejects.toThrow("offline");

    expect(await isCacheStale("expired-key", OFFLINE_CACHE_MAX_AGE_MS)).toBe(true);
  });

  it("throws when no cache and network fails", async () => {
    await expect(
      fetchNetworkFirstWithFallback("empty-key", async () => {
        throw new Error("offline");
      })
    ).rejects.toThrow("offline");
  });

  it.each([
    new ApiErrorException({ status: 409, code: "institution_mismatch", message: "wrong institution" }),
    new ApiErrorException({ status: 502, code: "validation_error", message: "invalid response" }),
    new ApiErrorException({ status: 404, code: "not_found", message: "missing" }),
    Object.assign(new Error("cancelled"), { name: "AbortError" })
  ])("never serves cached data for nonretryable failures", async (error) => {
    await setPersistedCache("nonretryable-key", { items: ["cached"] });

    await expect(fetchNetworkFirstWithFallback("nonretryable-key", async () => {
      throw error;
    })).rejects.toBe(error);
  });

  it("rejects and clears a structurally valid but schema-incompatible cache entry", async () => {
    await setPersistedCache("invalid-schema-key", { value: "wrong" });
    /** Rejects a cache entry whose value does not meet the test's numeric schema contract. */
    const schemaValidator = (value: unknown): value is { value: number } =>
      typeof value === "object" && value !== null && typeof (value as { value?: unknown }).value === "number";

    await expect(fetchNetworkFirstWithFallback("invalid-schema-key", async () => {
      throw new TypeError("offline");
    }, schemaValidator)).rejects.toThrow("offline");
    expect(await getPersistedCache("invalid-schema-key")).toBeNull();
  });
});

describe("getCacheStats", () => {
  afterEach(async () => {
    asyncStorageMock.failSet = false;
    await clearPersistedCache();
  });

  it("returns empty stats when no data", async () => {
    const stats = await getCacheStats();
    expect(stats.keyCount).toBe(0);
    expect(stats.oldestEntry).toBeNull();
    expect(stats.newestEntry).toBeNull();
    expect(stats.offlineKeys).toEqual([]);
  });

  it("counts stored keys", async () => {
    await setPersistedCache("s1", "a");
    await setPersistedCache("s2", "b");
    const stats = await getCacheStats();
    expect(stats.keyCount).toBe(2);
    expect(stats.oldestEntry).not.toBeNull();
    expect(stats.newestEntry).not.toBeNull();
  });
});
