/** Verifies BFF request dispatch across route and middleware boundaries. */

import { afterEach, describe, expect, it } from "vitest";
import { createMockRequest, createMockResponse, restoreEnvironment } from "./__tests__/httpMocks";
import { createRequestListener } from "./server";
import { clearRateLimitBuckets } from "./utils/rateLimit";

function createRequest(authorization: string, forwardedFor?: string, remoteAddress = "203.0.113.10") {
  return createMockRequest("/health", "GET", { authorization, ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}) }, remoteAddress);
}

describe("BFF listener dispatch", () => {
  const originalRequireAuth = process.env.BFF_REQUIRE_AUTH;
  const originalAuthToken = process.env.BFF_AUTH_TOKEN;

  afterEach(() => {
    clearRateLimitBuckets();
    restoreEnvironment({ BFF_REQUIRE_AUTH: originalRequireAuth, BFF_AUTH_TOKEN: originalAuthToken });
  });

  it("limits failed bearer attempts without denying a later valid credential", async () => {
    process.env.BFF_REQUIRE_AUTH = "true";
    process.env.BFF_AUTH_TOKEN = "expected-token";
    const listener = createRequestListener();

    for (let i = 0; i < 60; i++) {
      const capture = createMockResponse();
      await listener(createRequest("Bearer wrong-token"), capture.response);
      expect(capture.getStatus()).toBe(401);
      expect(capture.getHeaders()["x-request-id"]).toBeDefined();
    }

    const blockedFailure = createMockResponse();
    await listener(createRequest("Bearer wrong-token"), blockedFailure.response);
    expect(blockedFailure.getStatus()).toBe(429);

    const validResponse = createMockResponse();
    await listener(createRequest("Bearer expected-token"), validResponse.response);
    expect(validResponse.getStatus()).toBe(200);
  });

  it("does not let a direct private peer rotate rate-limit buckets with X-Forwarded-For", async () => {
    const listener = createRequestListener();
    for (let index = 0; index < 60; index += 1) {
      const capture = createMockResponse();
      await listener(createRequest("", `198.51.100.${index + 1}`, "192.168.1.44"), capture.response);
      expect(capture.getStatus()).toBe(200);
    }

    const blocked = createMockResponse();
    await listener(createRequest("", "203.0.113.1", "192.168.1.44"), blocked.response);
    expect(blocked.getStatus()).toBe(429);
  });
});
