import { describe, expect, it } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { guardMethods } from "../methodGuard";

function createMockReqRes(method: string) {
  const req = { method } as IncomingMessage;
  let statusCode = 0;
  let body = "";
  const headers: Record<string, string> = {};
  const res = {
    headersSent: false,
    setHeader(key: string, value: string) { headers[key] = value; return res; },
    writeHead(status: number) { statusCode = status; return res; },
    end(data?: string) { if (data) body = data; return res; },
    getStatusCode: () => statusCode,
    getBody: () => body,
    getHeaders: () => headers,
  } as unknown as ServerResponse & { getStatusCode: () => number; getBody: () => string; getHeaders: () => Record<string, string> };
  return { req, res };
}

describe("guardMethods", () => {
  it("allows GET requests", () => {
    const { req, res } = createMockReqRes("GET");
    expect(guardMethods(req, res, ["GET", "OPTIONS"])).toBe(true);
  });

  it("allows OPTIONS requests", () => {
    const { req, res } = createMockReqRes("OPTIONS");
    expect(guardMethods(req, res, ["GET", "OPTIONS"])).toBe(true);
  });

  it("rejects POST requests", () => {
    const { req, res } = createMockReqRes("POST");
    expect(guardMethods(req, res, ["GET", "OPTIONS"])).toBe(false);
  });

  it("rejects DELETE requests", () => {
    const { req, res } = createMockReqRes("DELETE");
    expect(guardMethods(req, res, ["GET", "OPTIONS"])).toBe(false);
  });

  it("sets Allow header on rejection", () => {
    const { req, res } = createMockReqRes("PUT");
    guardMethods(req, res, ["GET", "OPTIONS"]);
    expect(res.getHeaders()["Allow"]).toBe("GET, OPTIONS");
  });
});
