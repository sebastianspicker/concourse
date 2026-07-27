/** Verifies trusted-proxy CIDR validation and matching. */

import { describe, expect, it } from "vitest";
import { createTrustedProxyMatcher, validateTrustedProxyRanges } from "../trustedProxy";

describe("trusted proxy matcher", () => {
  it("matches IPv4, IPv6, mapped IPv6, and IPv4-embedded IPv6 CIDRs", () => {
    const matcher = createTrustedProxyMatcher([
      "10.24.0.0/16", "2001:db8::/32", "::ffff:192.0.2.0/120", "::192.0.2.0/120"
    ]);
    expect(matcher.isTrusted("::ffff:10.24.1.7")).toBe(true);
    expect(matcher.isTrusted("2001:db8::192.0.2.128")).toBe(true);
    expect(matcher.isTrusted("::ffff:192.0.2.128")).toBe(true);
    expect(matcher.isTrusted("::192.0.2.128")).toBe(true);
    expect(matcher.isTrusted("2001:db9::1")).toBe(false);
  });

  it("rejects malformed CIDRs", () => {
    expect(() => validateTrustedProxyRanges(["2001:db8::/129"])).toThrow("Invalid BFF_TRUSTED_PROXIES entry");
  });
});
