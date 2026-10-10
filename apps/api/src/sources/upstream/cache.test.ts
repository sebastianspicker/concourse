import { afterEach, describe, expect, it, vi } from "vitest";

import { cacheStats, clearCache, destroyCache, getCached } from "./cache";

afterEach(() => {
  clearCache();
  vi.useRealTimers();
});

describe("getCached", () => {
  it("serves a value only until its TTL expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const loader = vi.fn(async () => "fresh");

    await expect(getCached("ttl", loader, 1_000)).resolves.toBe("fresh");
    vi.advanceTimersByTime(999);
    await expect(getCached("ttl", loader, 1_000)).resolves.toBe("fresh");
    vi.advanceTimersByTime(1);
    await expect(getCached("ttl", loader, 1_000)).resolves.toBe("fresh");

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent loads for the same key", async () => {
    let resolveLoad: ((value: string) => void) | undefined;
    const loader = vi.fn(() => new Promise<string>((resolve) => { resolveLoad = resolve; }));

    const first = getCached("shared", loader, 1_000);
    const second = getCached("shared", loader, 1_000);
    resolveLoad?.("shared value");

    await expect(Promise.all([first, second])).resolves.toEqual(["shared value", "shared value"]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("aborts an admitted loader when its key is cleared", async () => {
    let observedSignal: AbortSignal | undefined;
    const loader = vi.fn((signal: AbortSignal) => new Promise<string>((_resolve, reject) => {
      observedSignal = signal;
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }));

    const pending = getCached("cancelled", loader, 1_000);
    clearCache("cancelled");

    expect(observedSignal?.aborted).toBe(true);
    await expect(pending).rejects.toBeDefined();
    await expect(getCached("cancelled", async () => "replacement", 1_000)).resolves.toBe("replacement");
  });

  it("keeps the cache at its fixed capacity and evicts the least recently used entry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    for (let index = 0; index < 1_000; index += 1) {
      await getCached(`capacity-${index}`, async () => index, 60_000);
      vi.advanceTimersByTime(1);
    }
    await getCached("capacity-1000", async () => 1_000, 60_000);

    expect(cacheStats()).toMatchObject({ size: 1_000, evictions: 1 });
    const oldestLoader = vi.fn(async () => -1);
    await expect(getCached("capacity-0", oldestLoader, 60_000)).resolves.toBe(-1);
    expect(oldestLoader).toHaveBeenCalledOnce();
  });

  it("returns but does not retain values excluded by the admission policy", async () => {
    const loader = vi.fn()
      .mockResolvedValueOnce({ data: "partial", degraded: true })
      .mockResolvedValueOnce({ data: "current", degraded: false });
    const shouldCache = (value: { degraded: boolean }) => !value.degraded;

    await expect(getCached("degraded", loader, 1_000, { shouldCache })).resolves.toEqual({ data: "partial", degraded: true });
    await expect(getCached("degraded", loader, 1_000, { shouldCache })).resolves.toEqual({ data: "current", degraded: false });
    await expect(getCached("degraded", loader, 1_000, { shouldCache })).resolves.toEqual({ data: "current", degraded: false });

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("destroys pending cache work without retaining its timeout", async () => {
    vi.useFakeTimers();
    const pending = getCached("never-settles", async () => new Promise<string>(() => undefined), 1_000);

    destroyCache();

    await expect(pending).rejects.toHaveProperty("name", "AbortError");
    expect(vi.getTimerCount()).toBe(0);
  });
});
