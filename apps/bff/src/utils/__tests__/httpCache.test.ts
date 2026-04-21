import { describe, expect, it } from "vitest";
import { sendJsonWithCache } from "../httpCache";

function createMockReqRes(headers?: Record<string, string>) {
  const req = {
    headers: headers ?? {}
  };
  let statusCode = 0;
  let body = "";
  const resHeaders: Record<string, string> = {};

  const res = {
    get headersSent() { return false; },
    writeHead(status: number, hdrs?: Record<string, string>) {
      statusCode = status;
      if (hdrs) Object.assign(resHeaders, hdrs);
      return res;
    },
    setHeader(key: string, value: string) {
      resHeaders[key] = value;
      return res;
    },
    end(data?: string) {
      if (data) body = data;
      return res;
    },
    getStatusCode: () => statusCode,
    getBody: () => body,
    getHeaders: () => resHeaders,
  };

  return { req, res };
}

describe("sendJsonWithCache", () => {
  it("sends JSON with 200 status", () => {
    const { req, res } = createMockReqRes();
    sendJsonWithCache(req as never, res as never, { hello: "world" });
    expect(res.getStatusCode()).toBe(200);
    expect(JSON.parse(res.getBody())).toEqual({ hello: "world" });
  });

  it("sets ETag header", () => {
    const { req, res } = createMockReqRes();
    sendJsonWithCache(req as never, res as never, { data: 1 });
    expect(res.getHeaders()["ETag"]).toMatch(/^"[a-f0-9]{32}"$/);
  });

  it("sets Cache-Control header with default max-age", () => {
    const { req, res } = createMockReqRes();
    sendJsonWithCache(req as never, res as never, {});
    expect(res.getHeaders()["Cache-Control"]).toBe("private, max-age=300");
  });

  it("sets custom max-age", () => {
    const { req, res } = createMockReqRes();
    sendJsonWithCache(req as never, res as never, {}, { maxAgeSeconds: 60 });
    expect(res.getHeaders()["Cache-Control"]).toBe("private, max-age=60");
  });

  it("returns 304 when If-None-Match matches ETag", () => {
    // First, get the ETag
    const { req: req1, res: res1 } = createMockReqRes();
    sendJsonWithCache(req1 as never, res1 as never, { data: "cached" });
    const etag = res1.getHeaders()["ETag"];

    // Second request with matching ETag
    const { req: req2, res: res2 } = createMockReqRes({ "if-none-match": etag });
    sendJsonWithCache(req2 as never, res2 as never, { data: "cached" });
    expect(res2.getStatusCode()).toBe(304);
    expect(res2.getBody()).toBe("");
  });

  it("returns 200 when If-None-Match does not match", () => {
    const { req, res } = createMockReqRes({ "if-none-match": '"wrong"' });
    sendJsonWithCache(req as never, res as never, { data: "fresh" });
    expect(res.getStatusCode()).toBe(200);
  });
});
