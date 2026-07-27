/** Verifies client-key selection across direct and proxied requests. */

import type { IncomingMessage } from "node:http";
import { describe, expect, it } from "vitest";
import { getClientKey } from "../clientKey";

function createRequest(options: { headers?: IncomingMessage["headers"]; remoteAddress?: string }): IncomingMessage {
  return {
    headers: options.headers ?? {},
    socket: { remoteAddress: options.remoteAddress }
  } as IncomingMessage;
}

const TRUSTED_EDGE = ["127.0.0.1", "10.24.0.0/16", "2001:db8:feed::/48"];

describe("getClientKey", () => {
  it("defaults to the socket address", () => {
    expect(getClientKey(createRequest({
      headers: { "x-forwarded-for": "203.0.113.10" }, remoteAddress: "127.0.0.1"
    }))).toBe("127.0.0.1");
  });

  it("does not honor headers from an untrusted private peer", () => {
    const req = createRequest({
      headers: { "x-forwarded-for": "198.51.100.10, 203.0.113.10" }, remoteAddress: "192.168.1.44"
    });
    expect(getClientKey(req, { trustProxy: "trusted", trustedProxies: TRUSTED_EDGE })).toBe("192.168.1.44");
  });

  it("does not honor Forwarded headers from an untrusted private peer", () => {
    const req = createRequest({
      headers: { forwarded: "for=203.0.113.10;proto=https" }, remoteAddress: "172.16.1.44"
    });
    expect(getClientKey(req, { trustProxy: "trusted", trustedProxies: TRUSTED_EDGE })).toBe("172.16.1.44");
  });

  it("uses a single client identity through an explicitly trusted proxy", () => {
    const req = createRequest({
      headers: { "x-forwarded-for": "203.0.113.10" }, remoteAddress: "127.0.0.1"
    });
    expect(getClientKey(req, { trustProxy: "trusted", trustedProxies: TRUSTED_EDGE })).toBe("203.0.113.10");
  });

  it("walks a trusted multi-proxy X-Forwarded-For chain right to left", () => {
    const req = createRequest({
      headers: { "x-forwarded-for": "198.51.100.10, 10.24.2.8" }, remoteAddress: "10.24.1.7"
    });
    expect(getClientKey(req, { trustProxy: "trusted", trustedProxies: TRUSTED_EDGE })).toBe("198.51.100.10");
  });

  it("uses the first untrusted address rather than an attacker-controlled leftmost value", () => {
    const req = createRequest({
      headers: { "x-forwarded-for": "198.51.100.99, 203.0.113.10, 10.24.2.8" }, remoteAddress: "10.24.1.7"
    });
    expect(getClientKey(req, { trustProxy: "trusted", trustedProxies: TRUSTED_EDGE })).toBe("203.0.113.10");
  });

  it("walks an RFC 7239 Forwarded chain right to left", () => {
    const req = createRequest({
      headers: { forwarded: "for=198.51.100.10;proto=https, for=10.24.2.8;proto=https" }, remoteAddress: "10.24.1.7"
    });
    expect(getClientKey(req, { trustProxy: "trusted", trustedProxies: TRUSTED_EDGE })).toBe("198.51.100.10");
  });

  it("fails closed to the socket address for malformed forwarded chains", () => {
    const req = createRequest({
      headers: { "x-forwarded-for": "198.51.100.10, unknown", forwarded: "for=198.51.100.88" }, remoteAddress: "127.0.0.1"
    });
    expect(getClientKey(req, { trustProxy: "trusted", trustedProxies: TRUSTED_EDGE })).toBe("127.0.0.1");
  });

  it("handles bracketed IPv6, IPv4 ports, IPv6 CIDRs, and IPv4-mapped IPv6 socket addresses", () => {
    const v4 = createRequest({
      headers: { "x-forwarded-for": "[2001:db8::1]:443" }, remoteAddress: "::ffff:10.24.1.7"
    });
    const v6 = createRequest({
      headers: { "x-forwarded-for": "203.0.113.10:443" }, remoteAddress: "2001:db8:feed::7"
    });
    expect(getClientKey(v4, { trustProxy: "trusted", trustedProxies: TRUSTED_EDGE })).toBe("2001:db8::1");
    expect(getClientKey(v6, { trustProxy: "trusted", trustedProxies: TRUSTED_EDGE })).toBe("203.0.113.10");
  });

  it("keeps the legacy always mode opt-in and unsafe", () => {
    const req = createRequest({
      headers: { "x-forwarded-for": "203.0.113.10" }, remoteAddress: "198.51.100.5"
    });
    expect(getClientKey(req, { trustProxy: "always" })).toBe("203.0.113.10");
  });
});
