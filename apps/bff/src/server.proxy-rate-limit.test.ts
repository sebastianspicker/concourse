/** Verifies proxy-aware client identities drive rate-limit isolation correctly. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse, restoreEnvironment } from "./__tests__/httpMocks";
import { createTrustedProxyMatcher } from "./utils/trustedProxy";

const matcher = createTrustedProxyMatcher(["10.24.0.0/16"]);
type RequestListener = ReturnType<typeof import("./server").createRequestListener>;

function request(forwardedFor: string, authorization?: string) {
  return createMockRequest("/health", "GET", { "x-forwarded-for": forwardedFor, ...(authorization ? { authorization } : {}) }, "10.24.1.7");
}

function chain(spoofedLeft: string, client: string): string {
  return `${spoofedLeft}, ${client}, 10.24.1.3`;
}

async function expectRotatingRequests(
  listener: RequestListener,
  authorization: string | undefined,
  expectedStatus: number
) {
  for (let index = 0; index < 60; index += 1) {
    const result = createMockResponse();
    await listener(request(chain(`198.51.100.${index + 1}`, "203.0.113.10"), authorization), result.response);
    expect(result.getStatus()).toBe(expectedStatus);
  }
}

describe("configured proxy rate-limit composition", () => {
  let createRequestListener: typeof import("./server").createRequestListener;
  let clearRateLimitBuckets: typeof import("./utils/rateLimit").clearRateLimitBuckets;
  const originalRequireAuth = process.env.BFF_REQUIRE_AUTH;
  const originalAuthToken = process.env.BFF_AUTH_TOKEN;

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock("./config/env", () => ({
      BFF_ENV: {
        corsOrigins: [], defaultCacheTtl: 300, institutionId: "hfmt", port: 4000,
        rruleExpansionHorizonDays: 90, trustedProxies: ["10.24.0.0/16"],
        trustedProxyMatcher: matcher, trustProxy: "trusted" as const
      }
    }));
    ({ createRequestListener } = await import("./server"));
    ({ clearRateLimitBuckets } = await import("./utils/rateLimit"));
  });

  afterEach(() => {
    clearRateLimitBuckets();
    vi.doUnmock("./config/env");
    restoreEnvironment({ BFF_REQUIRE_AUTH: originalRequireAuth, BFF_AUTH_TOKEN: originalAuthToken });
  });

  it("keeps invalid-auth attempts in one resolved-client bucket despite rotating spoofed values", async () => {
    process.env.BFF_REQUIRE_AUTH = "true";
    process.env.BFF_AUTH_TOKEN = "expected";
    const listener = createRequestListener();
    await expectRotatingRequests(listener, "Bearer wrong", 401);
    const blocked = createMockResponse();
    await listener(request(chain("198.51.100.250", "203.0.113.10"), "Bearer wrong"), blocked.response);
    expect(blocked.getStatus()).toBe(429);
  });

  it("keeps normal requests in one resolved-client bucket but separates distinct clients", async () => {
    delete process.env.BFF_REQUIRE_AUTH;
    const listener = createRequestListener();
    await expectRotatingRequests(listener, undefined, 200);
    const blocked = createMockResponse();
    await listener(request(chain("198.51.100.250", "203.0.113.10")), blocked.response);
    expect(blocked.getStatus()).toBe(429);

    const differentClient = createMockResponse();
    await listener(request(chain("198.51.100.250", "203.0.113.11")), differentClient.response);
    expect(differentClient.getStatus()).toBe(200);
  });
});
