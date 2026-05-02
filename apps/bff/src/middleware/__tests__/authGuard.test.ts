import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { guardAuth } from "../authGuard";

function createMockReqRes(headers: Record<string, string> = {}) {
  const req = { headers } as unknown as IncomingMessage;
  let statusCode = 0;
  let body = "";
  const resHeaders: Record<string, string> = {};
  const res = {
    headersSent: false,
    setHeader(key: string, value: string) { resHeaders[key] = value; return res; },
    writeHead(status: number) { statusCode = status; return res; },
    end(data?: string) { if (data) body = data; return res; },
    getStatusCode: () => statusCode,
    getBody: () => body,
    getHeaders: () => resHeaders,
  } as unknown as ServerResponse & {
    getStatusCode: () => number;
    getBody: () => string;
    getHeaders: () => Record<string, string>;
  };
  return { req, res };
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
      const { req, res } = createMockReqRes();
      expect(guardAuth(req, res)).toBe(true);
    });

    it("returns true even without any Authorization header", () => {
      const { req, res } = createMockReqRes({});
      expect(guardAuth(req, res)).toBe(true);
    });
  });

  it("requires auth when BFF_REQUIRE_AUTH=true", () => {
    process.env.BFF_REQUIRE_AUTH = "true";
    process.env.BFF_AUTH_TOKEN = "expected-token";
    const { req, res } = createMockReqRes({});

    const result = guardAuth(req, res, "req-true");

    expect(result).toBe(false);
    expect(res.getStatusCode()).toBe(401);
    const body = JSON.parse(res.getBody());
    expect(body.error.code).toBe("unauthorized");
  });

  it("fails closed for an unrecognized BFF_REQUIRE_AUTH value", () => {
    process.env.BFF_REQUIRE_AUTH = "enabled";
    process.env.BFF_AUTH_TOKEN = "expected-token";
    const { req, res } = createMockReqRes({});

    const result = guardAuth(req, res, "req-invalid-auth-mode");

    expect(result).toBe(false);
    expect(res.getStatusCode()).toBe(500);
    const body = JSON.parse(res.getBody());
    expect(body.error.code).toBe("auth_misconfigured");
  });

  describe("when BFF_REQUIRE_AUTH=1", () => {
    beforeEach(() => {
      process.env.BFF_REQUIRE_AUTH = "1";
      process.env.BFF_AUTH_TOKEN = "expected-token";
    });

    it("returns true for the configured Bearer token", () => {
      const { req, res } = createMockReqRes({ authorization: "Bearer expected-token" });
      expect(guardAuth(req, res, "req-1")).toBe(true);
    });

    it("returns false and sends 401 for a different Bearer token", () => {
      const { req, res } = createMockReqRes({ authorization: "Bearer other-token" });
      const result = guardAuth(req, res, "req-1b");
      expect(result).toBe(false);
      expect(res.getStatusCode()).toBe(401);
    });

    it("returns false and sends 500 when auth is required without a configured token", () => {
      delete process.env.BFF_AUTH_TOKEN;
      const { req, res } = createMockReqRes({ authorization: "Bearer expected-token" });
      const result = guardAuth(req, res, "req-misconfigured");
      expect(result).toBe(false);
      expect(res.getStatusCode()).toBe(500);
      const body = JSON.parse(res.getBody());
      expect(body.error.code).toBe("auth_misconfigured");
    });

    it("returns false and sends 401 when Authorization header is absent", () => {
      const { req, res } = createMockReqRes({});
      const result = guardAuth(req, res, "req-2");
      expect(result).toBe(false);
      expect(res.getStatusCode()).toBe(401);
      const body = JSON.parse(res.getBody());
      expect(body.error.code).toBe("unauthorized");
    });

    it("returns false and sends 401 when Authorization header is malformed (Basic scheme)", () => {
      const { req, res } = createMockReqRes({ authorization: "Basic dXNlcjpwYXNz" });
      const result = guardAuth(req, res, "req-3");
      expect(result).toBe(false);
      expect(res.getStatusCode()).toBe(401);
    });

    it("returns false and sends 401 when Authorization header is empty string", () => {
      const { req, res } = createMockReqRes({ authorization: "" });
      const result = guardAuth(req, res, "req-4");
      expect(result).toBe(false);
      expect(res.getStatusCode()).toBe(401);
    });

    it("sets x-request-id response header when requestId is provided", () => {
      const { req, res } = createMockReqRes({});
      guardAuth(req, res, "test-request-id");
      expect(res.getHeaders()["x-request-id"]).toBe("test-request-id");
    });
  });
});
