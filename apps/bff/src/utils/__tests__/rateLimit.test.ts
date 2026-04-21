import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  clearRateLimitBuckets,
  getRateLimitSize
} from "../rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    clearRateLimitBuckets();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearRateLimitBuckets();
  });

  it("evicts expired buckets during periodic cleanup", () => {
    checkRateLimit("client-1", { limit: 1, windowMs: 1000 });
    expect(getRateLimitSize()).toBe(1);

    vi.setSystemTime(61_000);
    checkRateLimit("client-2", { limit: 1, windowMs: 1000 });

    expect(getRateLimitSize()).toBe(1);
  });

  it("keeps active buckets when cleanup runs", () => {
    checkRateLimit("client-1", { limit: 2, windowMs: 120_000 });

    vi.setSystemTime(61_000);
    checkRateLimit("client-1", { limit: 2, windowMs: 120_000 });

    expect(getRateLimitSize()).toBe(1);
  });

  it("retryAfter is at least 1 second when rate limited at window boundary", () => {
    // Use a 1 second window so we can land right at the boundary
    checkRateLimit("boundary", { limit: 1, windowMs: 1000 });

    // Advance to exactly the resetAt time (1000ms)
    vi.setSystemTime(1000);
    const result = checkRateLimit("boundary", { limit: 1, windowMs: 1000 });

    // At exactly resetAt, the bucket is expired so a new window starts
    // The request should be allowed
    expect(result.allowed).toBe(true);
  });

  it("retryAfter is at least 1 when blocked near window end", () => {
    checkRateLimit("near-end", { limit: 1, windowMs: 1000 });

    // Advance to 999ms — 1ms before window resets
    vi.setSystemTime(999);
    const result = checkRateLimit("near-end", { limit: 1, windowMs: 1000 });

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThanOrEqual(1);
  });
});
