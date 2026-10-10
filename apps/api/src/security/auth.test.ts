import { describe, expect, it } from "vitest";
import { createTestConfig } from "../testing/config";
import { createMockReqRes, expectCapturedError } from "../testing/httpMocks";
import { guardAuth, isInvalidAuthAttempt, validateAuthConfiguration } from "./auth";

describe("guardAuth", () => {
  it("allows public deployments", () => {
    const { request, response } = createMockReqRes();
    expect(guardAuth(request, response, createTestConfig())).toBe(true);
  });

  it("requires the configured bearer token when auth is enabled", () => {
    const config = createTestConfig({ BFF_REQUIRE_AUTH: "true", BFF_AUTH_TOKEN: "expected-token" });
    const denied = createMockReqRes();
    expect(guardAuth(denied.request, denied.response, config)).toBe(false);
    expectCapturedError(denied.capture, 401, "unauthorized");
    const allowed = createMockReqRes({ headers: { authorization: "Bearer expected-token" } });
    expect(guardAuth(allowed.request, allowed.response, config)).toBe(true);
    expect(isInvalidAuthAttempt(allowed.request, config)).toBe(false);

    const prefix = createMockReqRes({ headers: { authorization: "Bearer expected" } });
    expect(guardAuth(prefix.request, prefix.response, config)).toBe(false);
    expect(isInvalidAuthAttempt(prefix.request, config)).toBe(true);
  });

  it("fails closed when required authentication is misconfigured", () => {
    const config = createTestConfig({ BFF_REQUIRE_AUTH: "true" });
    const { capture, request, response } = createMockReqRes();
    expect(guardAuth(request, response, config)).toBe(false);
    expectCapturedError(capture, 500, "auth_misconfigured");
    expect(() => validateAuthConfiguration(config)).toThrow("BFF_AUTH_TOKEN is required when BFF_REQUIRE_AUTH enables authentication");
  });

  it("fails closed when the auth requirement value is invalid", () => {
    const config = createTestConfig({ BFF_REQUIRE_AUTH: "maybe", BFF_AUTH_TOKEN: "expected-token" });
    const { capture, request, response } = createMockReqRes();
    expect(guardAuth(request, response, config)).toBe(false);
    expectCapturedError(capture, 500, "auth_misconfigured");
    expect(() => validateAuthConfiguration(config)).toThrow("BFF_REQUIRE_AUTH has an invalid value");
  });
});
