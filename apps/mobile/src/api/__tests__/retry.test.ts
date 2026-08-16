/** Verifies retry attempts honor backoff limits, cancellation, and server retry guidance. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withRetry } from "../retry";

/** Mock setTimeout to record delays and resolve immediately */
function mockSetTimeoutImmediate(delays: number[]): void {
  vi.spyOn(globalThis, "setTimeout").mockImplementation(((fn: () => void, ms?: number) => {
    if (ms !== undefined && ms > 0) delays.push(ms);
    if (typeof fn === "function") fn();
    return 0;
  }) as typeof setTimeout);
}

function failWithNetworkErrorThenSucceed(failureCount: number) {
  const operation = vi.fn();
  for (let attempt = 0; attempt < failureCount; attempt += 1) {
    operation.mockRejectedValueOnce(new TypeError("network"));
  }
  return operation.mockResolvedValueOnce("ok");
}

async function collectNetworkRetryDelays(baseDelayMs: number): Promise<number[]> {
  const delays: number[] = [];
  mockSetTimeoutImmediate(delays);
  await withRetry(failWithNetworkErrorThenSucceed(3), { retries: 3, baseDelayMs, maxDelayMs: 30_000 });
  return delays;
}

describe("withRetry", () => {
  it("returns on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce("recovered");

    const result = await withRetry(fn, { retries: 2, baseDelayMs: 1 });
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting retries", async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError("network error"));

    await expect(withRetry(fn, { retries: 1, baseDelayMs: 1 })).rejects.toThrow("network error");
    expect(fn).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
  });

  it("preserves the terminal error identity", async () => {
    const error = new Error("not found");
    (error as { status?: number }).status = 404;

    await expect(withRetry(vi.fn().mockRejectedValue(error))).rejects.toBe(error);
  });

  it("aborts before invoking the operation", async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockResolvedValue("ok");
    controller.abort();

    await expect(withRetry(fn, { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(fn).not.toHaveBeenCalled();
  });

  it("does not retry AbortError", async () => {
    const err = new Error("aborted");
    (err as { name: string }).name = "AbortError";
    const fn = vi.fn().mockRejectedValue(err);

    await expect(withRetry(fn, { retries: 3 })).rejects.toThrow("aborted");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry 4xx errors except 429", async () => {
    const err = new Error("not found");
    (err as { status?: number }).status = 404;
    const fn = vi.fn().mockRejectedValue(err);

    await expect(withRetry(fn, { retries: 3 })).rejects.toThrow("not found");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on 429", async () => {
    const err429 = new Error("rate limited");
    (err429 as { status?: number }).status = 429;
    const fn = vi.fn()
      .mockRejectedValueOnce(err429)
      .mockResolvedValueOnce("ok");

    const result = await withRetry(fn, { retries: 2, baseDelayMs: 1 });
    expect(result).toBe("ok");
  });

  it("retries on 5xx errors", async () => {
    const err500 = new Error("server error");
    (err500 as { status?: number }).status = 500;
    const fn = vi.fn()
      .mockRejectedValueOnce(err500)
      .mockResolvedValueOnce("recovered");

    const result = await withRetry(fn, { retries: 2, baseDelayMs: 1 });
    expect(result).toBe("recovered");
  });
});

describe("withRetry: exponential backoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("crypto", {
      getRandomValues: (array: Uint32Array) => {
        array[0] = 0x80000000;
        return array;
      }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exponential delay progression: baseDelay * 2^attempt with midpoint jitter", async () => {
    const delays = await collectNetworkRetryDelays(1000);

    // With crypto midpoint randomness, jitter factor is 0, so delays are exact:
    // attempt 1: 1000 * 2^1 = 2000
    // attempt 2: 1000 * 2^2 = 4000
    // attempt 3: 1000 * 2^3 = 8000
    expect(delays).toHaveLength(3);
    expect(delays[0]).toBe(2000);
    expect(delays[1]).toBe(4000);
    expect(delays[2]).toBe(8000);
  });

  it("max delay cap: never exceeds maxDelayMs", async () => {
    // baseDelay 10000 * 2^3 = 80000, but the helper's maxDelayMs is 30000.
    const delays = await collectNetworkRetryDelays(10_000);

    for (const d of delays) {
      expect(d).toBeLessThanOrEqual(30000);
    }
  });

  it("jitter stays within +-25% of calculated delay", async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    // Run many iterations to check jitter bounds
    const delays: number[] = [];

    for (let i = 0; i < 50; i++) {
      mockSetTimeoutImmediate(delays);

      const fn = vi.fn()
        .mockRejectedValueOnce(new TypeError("network"))
        .mockResolvedValueOnce("ok");

      await withRetry(fn, { retries: 1, baseDelayMs: 1000 });
      vi.restoreAllMocks();
    }

    // attempt 1: base = 1000 * 2^1 = 2000; +-25% means [1500, 2500]
    for (const d of delays) {
      expect(d).toBeGreaterThanOrEqual(1500);
      expect(d).toBeLessThanOrEqual(2500);
    }
  });

  it("Retry-After header (seconds) overrides calculated delay", async () => {
    const delays: number[] = [];
    mockSetTimeoutImmediate(delays);

    const err = Object.assign(new Error("rate limited"), { status: 429, retryAfterInSeconds: 5 });
    const fn = vi.fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce("ok");

    await withRetry(fn, { retries: 2, baseDelayMs: 1000 });

    expect(delays[0]).toBe(5000); // 5 seconds * 1000
  });

  it("does not retry 4xx (400, 403, 404) because client errors are not transient", async () => {
    for (const status of [400, 403, 404]) {
      const err = new Error(`status ${status}`);
      (err as { status?: number }).status = status;
      const fn = vi.fn().mockRejectedValue(err);

      await expect(withRetry(fn, { retries: 3, baseDelayMs: 1 })).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    }
  });

  it("retries network errors (TypeError)", async () => {
    const delays: number[] = [];
    mockSetTimeoutImmediate(delays);

    const fn = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce("ok");

    const result = await withRetry(fn, { retries: 2, baseDelayMs: 1000 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws last error when all retries exhausted", async () => {
    const delays: number[] = [];
    mockSetTimeoutImmediate(delays);

    const fn = vi.fn()
      .mockRejectedValueOnce(new TypeError("first"))
      .mockRejectedValueOnce(new TypeError("second"))
      .mockRejectedValueOnce(new TypeError("final failure"));

    await expect(withRetry(fn, { retries: 2, baseDelayMs: 100 })).rejects.toThrow("final failure");
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("aborts while waiting to retry", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const fn = vi.fn().mockRejectedValue(new TypeError("network"));

    const result = withRetry(fn, {
      retries: 2,
      baseDelayMs: 1000,
      signal: controller.signal
    });

    controller.abort();
    vi.runAllTimers();

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    vi.useRealTimers();
  });
});
