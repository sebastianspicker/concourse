/** Verifies cache expiry, refresh, and in-flight loading behavior. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCached, clearCache, cacheStats, destroyCache } from "../cache";

describe("cache: TTL and eviction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearCache();
  });

  afterEach(() => {
    destroyCache();
    vi.useRealTimers();
  });

  it("fresh entry is readable", async () => {
    const value = await getCached("key1", () => Promise.resolve("val1"), 5000);
    expect(value).toBe("val1");

    // Read again; the value should be cached.
    const loader = vi.fn().mockResolvedValue("val1-fresh");
    const cached = await getCached("key1", loader, 5000);
    expect(cached).toBe("val1");
    expect(loader).not.toHaveBeenCalled();
  });

  it("entry becomes unreadable after TTL expires", async () => {
    await getCached("key2", () => Promise.resolve("original"), 1000);

    // Advance past TTL
    vi.advanceTimersByTime(1001);

    // Should call loader again
    const value = await getCached("key2", () => Promise.resolve("refreshed"), 1000);
    expect(value).toBe("refreshed");
  });

  it("LRU eviction when max entries reached", async () => {
    // Fill up the cache: getCached adds entries up to MAX_CACHE_ENTRIES (1000)
    // We insert 1001 entries to trigger eviction
    for (let i = 0; i < 1001; i++) {
      await getCached(`fill-${i}`, () => Promise.resolve(`v${i}`), 300_000);
    }

    // The stats should show evictions occurred
    const stats = cacheStats();
    expect(stats.evictions).toBeGreaterThan(0);
  });

  it("periodic sweep removes expired entries", async () => {
    await getCached("sweep-1", () => Promise.resolve("a"), 2000);
    await getCached("sweep-2", () => Promise.resolve("b"), 2000);

    // Advance past TTL + sweep interval
    vi.advanceTimersByTime(61_000);

    // Trigger a cache access to verify sweep occurred
    // The expired entries should have been swept
    const loader = vi.fn().mockResolvedValue("fresh");
    const val = await getCached("sweep-1", loader, 5000);
    expect(val).toBe("fresh"); // Should have reloaded (old entry expired)
    expect(loader).toHaveBeenCalled();
  });

  it("stats() reports correct hit/miss/eviction counts", async () => {
    // Start fresh
    clearCache();

    // Miss: first load
    await getCached("s1", () => Promise.resolve("v1"), 5000);
    // Hit: cached
    await getCached("s1", () => Promise.resolve("v1b"), 5000);
    // Miss: different key
    await getCached("s2", () => Promise.resolve("v2"), 5000);
    // Hit: cached
    await getCached("s2", () => Promise.resolve("v2b"), 5000);

    const stats = cacheStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(2);
    expect(stats.size).toBe(2);
  });

  it("destroy() clears cache and can be called safely multiple times", async () => {
    await getCached("d1", () => Promise.resolve("val"), 5000);
    const beforeStats = cacheStats();
    expect(beforeStats.size).toBe(1);

    destroyCache();
    const afterStats = cacheStats();
    expect(afterStats.size).toBe(0);

    // Safe to call multiple times
    destroyCache();
  });

  it("can skip caching selected results", async () => {
    type CacheableValue = { value: string; cacheable: boolean };
    const loader = vi.fn<() => Promise<CacheableValue>>()
      .mockResolvedValueOnce({ value: "first", cacheable: false })
      .mockResolvedValueOnce({ value: "second", cacheable: false });

    const first = await getCached("skip-cache", loader, 5000, {
      shouldCache: (result) => result.cacheable
    });
    const second = await getCached("skip-cache", loader, 5000, {
      shouldCache: (result) => result.cacheable
    });

    expect(first.value).toBe("first");
    expect(second.value).toBe("second");
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("keeps a timed-out loader accounted for until its underlying work settles", async () => {
    let settle!: () => void;
    const loader = vi.fn((signal: AbortSignal) => new Promise<string>((resolve) => {
      signal.addEventListener("abort", () => undefined);
      settle = () => resolve("late");
    }));
    const first = getCached("abortable", loader, 5000, { inFlightTimeoutMs: 10 });
    const rejected = expect(first).rejects.toThrow("Cache loader timeout");
    await vi.advanceTimersByTimeAsync(10);
    await rejected;
    expect(loader.mock.calls[0][0].aborted).toBe(true);

    await expect(getCached("abortable", async () => "must-not-run", 5000)).rejects.toThrow("Cache loader timeout");
    expect(loader).toHaveBeenCalledTimes(1);

    settle();
    await Promise.resolve();
    await Promise.resolve();
    await expect(getCached("abortable", async () => "retried", 5000)).resolves.toBe("retried");
  });
});
