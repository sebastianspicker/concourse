/** Verifies optional BFF authentication configuration and request handling. */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockReqRes, expectCapturedError } from "../../__tests__/httpMocks";
import { guardAuth, isInvalidAuthAttempt, validateAuthConfiguration } from "../authGuard";

function createAuthMocks(headers: Record<string, string> = {}) {
  const { capture, request, response } = createMockReqRes({ headers });
  return { req: request, res: response, result: capture };
}

describe("guardAuth", () => {
  const originalEnv = process.env.BFF_REQUIRE_AUTH;
  const originalToken = process.env.BFF_AUTH_TOKEN;

  beforeEach(() => {
    delete process.env.BFF_REQUIRE_AUTH;
    delete process.env.BFF_AUTH_TOKEN;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.BFF_REQUIRE_AUTH = originalEnv;
    } else {
      delete process.env.BFF_REQUIRE_AUTH;
    }
    if (originalToken !== undefined) {
      process.env.BFF_AUTH_TOKEN = originalToken;
    } else {
      delete process.env.BFF_AUTH_TOKEN;
    }
  });

  describe("when BFF_REQUIRE_AUTH is not set", () => {
    it("returns true without inspecting the Authorization header", () => {
      const { req, res } = createAuthMocks();
      expect(guardAuth(req, res)).toBe(true);
    });

    it("returns true even without any Authorization header", () => {
      const { req, res } = createAuthMocks({});
      expect(guardAuth(req, res)).toBe(true);
    });
  });

  it("requires auth when BFF_REQUIRE_AUTH=true", () => {
    process.env.BFF_REQUIRE_AUTH = "true";
    process.env.BFF_AUTH_TOKEN = "expected-token";
    const { req, res, result: capture } = createAuthMocks({});

    const result = guardAuth(req, res, "req-true");

    expect(result).toBe(false);
    expectCapturedError(capture, 401, "unauthorized");
  });

  it("fails closed for an unrecognized BFF_REQUIRE_AUTH value", () => {
    process.env.BFF_REQUIRE_AUTH = "enabled";
    process.env.BFF_AUTH_TOKEN = "expected-token";
    const { req, res, result: capture } = createAuthMocks({});

    const result = guardAuth(req, res, "req-invalid-auth-mode");

    expect(result).toBe(false);
    expectCapturedError(capture, 500, "auth_misconfigured");
  });

  it("sets request id on invalid auth mode responses", () => {
    process.env.BFF_REQUIRE_AUTH = "enabled";
    const { req, res, result: capture } = createAuthMocks({});

    guardAuth(req, res, "req-invalid-mode-header");

    expect(capture.getHeaders()["x-request-id"]).toBe("req-invalid-mode-header");
  });

  describe("when BFF_REQUIRE_AUTH=1", () => {
    beforeEach(() => {
      process.env.BFF_REQUIRE_AUTH = "1";
      process.env.BFF_AUTH_TOKEN = "expected-token";
    });

    it("returns true for the configured Bearer token", () => {
      const { req, res } = createAuthMocks({ authorization: "Bearer expected-token" });
      expect(guardAuth(req, res, "req-1")).toBe(true);
    });

    it("returns false and sends 401 for a different Bearer token", () => {
      const { req, res, result: capture } = createAuthMocks({ authorization: "Bearer other-token" });
      expect(isInvalidAuthAttempt(req)).toBe(true);
      const result = guardAuth(req, res, "req-1b");
      expect(result).toBe(false);
      expect(capture.getStatus()).toBe(401);
    });

    it("returns false and sends 500 when auth is required without a configured token", () => {
      delete process.env.BFF_AUTH_TOKEN;
      const { req, res, result: capture } = createAuthMocks({ authorization: "Bearer expected-token" });
      const result = guardAuth(req, res, "req-misconfigured");
      expect(result).toBe(false);
      expectCapturedError(capture, 500, "auth_misconfigured");
    });

    it("returns false and sends 401 when Authorization header is absent", () => {
      const { req, res, result: capture } = createAuthMocks({});
      const result = guardAuth(req, res, "req-2");
      expect(result).toBe(false);
      expectCapturedError(capture, 401, "unauthorized");
    });

    it("returns false and sends 401 when Authorization header is malformed (Basic scheme)", () => {
      const { req, res, result: capture } = createAuthMocks({ authorization: "Basic dXNlcjpwYXNz" });
      const result = guardAuth(req, res, "req-3");
      expect(result).toBe(false);
      expect(capture.getStatus()).toBe(401);
    });

    it("trims whitespace around Bearer token values", () => {
      const { req, res } = createAuthMocks({ authorization: "Bearer  expected-token  " });
      expect(isInvalidAuthAttempt(req)).toBe(false);
      expect(guardAuth(req, res, "req-trimmed-token")).toBe(true);
    });

    it("returns false and sends 401 when Authorization header is empty string", () => {
      const { req, res, result: capture } = createAuthMocks({ authorization: "" });
      const result = guardAuth(req, res, "req-4");
      expect(result).toBe(false);
      expect(capture.getStatus()).toBe(401);
    });

    it("sets x-request-id response header when requestId is provided", () => {
      const { req, res, result: capture } = createAuthMocks({});
      guardAuth(req, res, "test-request-id");
      expect(capture.getHeaders()["x-request-id"]).toBe("test-request-id");
    });
  });
});

describe("validateAuthConfiguration", () => {
  it("rejects an invalid auth mode before the server starts", () => {
    expect(() => validateAuthConfiguration({ BFF_REQUIRE_AUTH: "enabled" })).toThrow(
      "BFF_REQUIRE_AUTH has an invalid value"
    );
  });

  it("rejects required auth without a bearer token before the server starts", () => {
    expect(() => validateAuthConfiguration({ BFF_REQUIRE_AUTH: "true" })).toThrow(
      "BFF_AUTH_TOKEN is required"
    );
  });

  it("accepts disabled auth and required auth with a token", () => {
    expect(() => validateAuthConfiguration({ BFF_REQUIRE_AUTH: "false" })).not.toThrow();
    expect(() => validateAuthConfiguration({ BFF_REQUIRE_AUTH: "true", BFF_AUTH_TOKEN: "token" })).not.toThrow();
  });
});
