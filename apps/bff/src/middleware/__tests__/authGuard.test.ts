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

  beforeEach(() => {
    delete process.env.BFF_REQUIRE_AUTH;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.BFF_REQUIRE_AUTH = originalEnv;
    } else {
      delete process.env.BFF_REQUIRE_AUTH;
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

  describe("when BFF_REQUIRE_AUTH=1", () => {
    beforeEach(() => {
      process.env.BFF_REQUIRE_AUTH = "1";
    });

    it("returns true for a valid Bearer token", () => {
      const { req, res } = createMockReqRes({ authorization: "Bearer some-token" });
      expect(guardAuth(req, res, "req-1")).toBe(true);
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
