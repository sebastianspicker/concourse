import { afterEach, describe, expect, it } from "vitest";
import { createMockReqRes, expectCapturedError } from "../../__tests__/httpMocks";
import { guardAuth } from "../authGuard";

const initial = { BFF_AUTH_TOKEN: process.env.BFF_AUTH_TOKEN, BFF_REQUIRE_AUTH: process.env.BFF_REQUIRE_AUTH };

afterEach(() => {
  for (const [key, value] of Object.entries(initial)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("guardAuth", () => {
  it("allows public deployments", () => {
    delete process.env.BFF_REQUIRE_AUTH;
    const { request, response } = createMockReqRes();
    expect(guardAuth(request, response)).toBe(true);
  });

  it("requires the configured bearer token when auth is enabled", () => {
    process.env.BFF_REQUIRE_AUTH = "true";
    process.env.BFF_AUTH_TOKEN = "expected-token";
    const denied = createMockReqRes();
    expect(guardAuth(denied.request, denied.response, "request-1")).toBe(false);
    expectCapturedError(denied.capture, 401, "unauthorized");
    const allowed = createMockReqRes({ headers: { authorization: "Bearer expected-token" } });
    expect(guardAuth(allowed.request, allowed.response)).toBe(true);
  });

  it("fails closed when required authentication is misconfigured", () => {
    process.env.BFF_REQUIRE_AUTH = "true";
    delete process.env.BFF_AUTH_TOKEN;
    const { capture, request, response } = createMockReqRes();
    expect(guardAuth(request, response)).toBe(false);
    expectCapturedError(capture, 500, "auth_misconfigured");
  });
});
