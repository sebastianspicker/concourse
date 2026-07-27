/** Exercises rate limiting through the BFF request listener. */

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createRequestListener } from "./server";
import { clearRateLimitBuckets } from "./utils/rateLimit";

describe("BFF server rate limiting integration", () => {
  beforeAll(() => {
    process.env.INSTITUTION_ID = process.env.INSTITUTION_ID ?? "hfmt";
  });

  afterEach(() => {
    clearRateLimitBuckets();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("enforces rate limit threshold correctly", async () => {
    const app = createRequestListener();
    const limit = 60;

    for (let i = 0; i < limit; i++) {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
    }

    const res = await request(app).get("/health").expect(429);
    expect(res.body.error.code).toBe("rate_limited");
  });

  it("rate limit resets after window", async () => {
    vi.useFakeTimers();

    const app = createRequestListener();
    const limit = 60;

    for (let i = 0; i < limit + 5; i++) {
      await request(app).get("/health");
    }

    let res = await request(app).get("/health").expect(429);
    expect(res.body.error.code).toBe("rate_limited");

    vi.advanceTimersByTime(65000);

    res = await request(app).get("/health").expect(200);
    expect(res.body.status).toBe("ok");
  });

  it("rate limit headers are not present in normal responses", async () => {
    const app = createRequestListener();
    const res = await request(app).get("/health").expect(200);

    expect(res.headers["retry-after"]).toBeUndefined();
  });

  it("rate limit is enforced across different endpoints", async () => {
    const app = createRequestListener();
    const limit = 60;

    for (let i = 0; i < limit; i++) {
      await request(app).get("/health");
    }

    const res = await request(app).get("/events").expect(429);
    expect(res.body.error.code).toBe("rate_limited");
  });

  it("handles concurrent requests correctly", async () => {
    const app = createRequestListener();
    const requests = Array.from({ length: 30 }, () => request(app).get("/health"));

    const responses = await Promise.all(requests);

    for (const res of responses) {
      expect(res.status).toBe(200);
    }
  });
});
