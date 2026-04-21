import type { IncomingMessage } from "node:http";
import { describe, expect, it } from "vitest";
import { getClientKey } from "../clientKey";

function createRequest(options: {
  headers?: IncomingMessage["headers"];
  remoteAddress?: string;
}): IncomingMessage {
  return {
    headers: options.headers ?? {},
    socket: {
      remoteAddress: options.remoteAddress
    }
  } as IncomingMessage;
}

describe("getClientKey", () => {
  it("ignores forwarded headers when trustProxy is never", () => {
    const req = createRequest({
      headers: { "x-forwarded-for": "203.0.113.10" },
      remoteAddress: "198.51.100.5"
    });

    const key = getClientKey(req, { trustProxy: "never" });

    expect(key).toBe("198.51.100.5");
  });

  it("uses x-forwarded-for when trustProxy is always", () => {
    const req = createRequest({
      headers: { "x-forwarded-for": "203.0.113.10" },
      remoteAddress: "198.51.100.5"
    });

    const key = getClientKey(req, { trustProxy: "always" });

    expect(key).toBe("203.0.113.10");
  });

  it("trusts forwarded headers when auto and remote address is private", () => {
    const req = createRequest({
      headers: { "x-forwarded-for": "203.0.113.10" },
      remoteAddress: "127.0.0.1"
    });

    const key = getClientKey(req, { trustProxy: "auto" });

    expect(key).toBe("203.0.113.10");
  });

  it("ignores forwarded headers when auto and remote address is public", () => {
    const req = createRequest({
      headers: { "x-forwarded-for": "203.0.113.10" },
      remoteAddress: "198.51.100.5"
    });

    const key = getClientKey(req, { trustProxy: "auto" });

    expect(key).toBe("198.51.100.5");
  });

  it("parses Forwarded header when allowed", () => {
    const req = createRequest({
      headers: { forwarded: "for=203.0.113.60;proto=http;by=203.0.113.43" },
      remoteAddress: "127.0.0.1"
    });

    const key = getClientKey(req, { trustProxy: "auto" });

    expect(key).toBe("203.0.113.60");
  });
});
