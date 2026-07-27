/** Verifies health remains independent of simulated upstream-source failures. */

import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createRequestListener } from "./server";
import { clearRateLimitBuckets } from "./utils/rateLimit";

describe("BFF server external-source resilience integration", () => {
  afterEach(() => {
    clearRateLimitBuckets();
    vi.unstubAllGlobals();
  });

  it("keeps health checks independent from external sources", async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error("External source unavailable"));
    vi.stubGlobal("fetch", fetchSpy);

    const app = createRequestListener();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
