import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rateLimit";

describe("createRateLimiter", () => {
  it("allows 60 requests per key then reports a retry delay", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 60; i += 1) expect(limiter.check("client").allowed).toBe(true);
    const limited = limiter.check("client");

    expect(limited.allowed).toBe(false);
    expect(limited.retryAfter).toBeGreaterThanOrEqual(1);
    expect(limited.retryAfter).toBeLessThanOrEqual(60);
    expect(limiter.check("other").allowed).toBe(true);
  });

  it("keeps quota state isolated per limiter instance", () => {
    const first = createRateLimiter();
    expect(first.check("client", { limit: 1 }).allowed).toBe(true);
    expect(first.check("client", { limit: 1 }).allowed).toBe(false);
    expect(createRateLimiter().check("client", { limit: 1 }).allowed).toBe(true);
  });

  it("evicts the oldest buckets once the 20,000-bucket cap is reached", () => {
    const limiter = createRateLimiter();
    limiter.check("oldest", { limit: 1 });
    for (let i = 0; i < 20_000; i += 1) limiter.check(`filler-${i}`);

    expect(limiter.check("oldest", { limit: 1 }).allowed).toBe(true);
  });
});
