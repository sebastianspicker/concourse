import { afterEach, describe, expect, it, vi } from "vitest";

// Mock AsyncStorage — it tries to access window in Node test env
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: null,
}));

import {
  getPersistedCache,
  setPersistedCache,
  clearPersistedCache,
  fetchNetworkFirstWithFallback,
  getCacheStats,
  isCacheStale,
} from "../persistedCache";

describe("persistedCache", () => {
  afterEach(async () => {
    await clearPersistedCache();
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
});

describe("fetchNetworkFirstWithFallback", () => {
  afterEach(async () => {
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

  it("falls back to cache on network failure", async () => {
    // First: populate cache
    await setPersistedCache("fallback-key", { items: ["cached"] });

    // Second: loader fails
    const result = await fetchNetworkFirstWithFallback<{ items: string[] }>(
      "fallback-key",
      async () => {
        throw new Error("network error");
      }
    );
    expect(result.data).toEqual({ items: ["cached"] });
    expect(result.fromCache).toBe(true);
    expect(result.isOffline).toBe(true);
    expect(result.cacheAge).toBeGreaterThanOrEqual(0);
  });

  it("throws when no cache and network fails", async () => {
    await expect(
      fetchNetworkFirstWithFallback("empty-key", async () => {
        throw new Error("offline");
      })
    ).rejects.toThrow("offline");
  });
});

describe("getCacheStats", () => {
  afterEach(async () => {
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
