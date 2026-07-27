/** Verifies JSON response caching headers and serialization. */

import { describe, expect, it } from "vitest";
import { createMockReqRes as createHttpMocks } from "../../__tests__/httpMocks";
import { sendJsonWithCache } from "../httpCache";

function createMockReqRes(headers?: Record<string, string>) {
  const { capture, request, response } = createHttpMocks({ headers });
  return { req: request, res: response, result: capture };
}

describe("sendJsonWithCache", () => {
  it("sends JSON with 200 status", () => {
    const { req, res, result } = createMockReqRes();
    sendJsonWithCache(req, res, { hello: "world" });
    expect(result.getStatus()).toBe(200);
    expect(JSON.parse(result.getBody() ?? "{}")).toEqual({ hello: "world" });
  });

  it("sets ETag header", () => {
    const { req, res, result } = createMockReqRes();
    sendJsonWithCache(req, res, { data: 1 });
    expect(result.getHeaders().etag).toMatch(/^"[a-f0-9]{32}"$/);
  });

  it("sets Cache-Control header with default max-age", () => {
    const { req, res, result } = createMockReqRes();
    sendJsonWithCache(req, res, {});
    expect(result.getHeaders()["cache-control"]).toBe("private, max-age=300");
  });

  it("sets custom max-age", () => {
    const { req, res, result } = createMockReqRes();
    sendJsonWithCache(req, res, {}, { maxAgeSeconds: 60 });
    expect(result.getHeaders()["cache-control"]).toBe("private, max-age=60");
  });

  it("returns 304 when If-None-Match matches ETag", () => {
    // First, get the ETag
    const { req: req1, res: res1, result: firstResult } = createMockReqRes();
    sendJsonWithCache(req1, res1, { data: "cached" });
    const etag = firstResult.getHeaders().etag;

    // Second request with matching ETag
    const { req: req2, res: res2, result } = createMockReqRes({ "if-none-match": etag });
    sendJsonWithCache(req2, res2, { data: "cached" });
    expect(result.getStatus()).toBe(304);
    expect(result.getBody()).toBe("");
  });

  it("returns 200 when If-None-Match does not match", () => {
    const { req, res, result } = createMockReqRes({ "if-none-match": '"wrong"' });
    sendJsonWithCache(req, res, { data: "fresh" });
    expect(result.getStatus()).toBe(200);
  });
});
