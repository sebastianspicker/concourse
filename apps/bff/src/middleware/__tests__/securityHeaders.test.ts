/** Verifies security response headers applied by the BFF middleware. */

import { describe, expect, it } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { guardSecurityHeaders } from "../securityHeaders";

function createMockResponse(): ServerResponse & { headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader(key: string, value: string) {
      headers[key] = value;
      return this;
    }
  } as unknown as ServerResponse & { headers: Record<string, string> };
}

describe("guardSecurityHeaders", () => {
  it("sets all security headers", () => {
    const res = createMockResponse();
    guardSecurityHeaders({} as IncomingMessage, res);

    expect(res.headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(res.headers["X-Frame-Options"]).toBe("DENY");
    expect(res.headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(res.headers["Strict-Transport-Security"]).toBe("max-age=31536000; includeSubDomains; preload");
    expect(res.headers["Content-Security-Policy"]).toBe("default-src 'none'; frame-ancestors 'none'; sandbox");
    expect(res.headers["X-Permitted-Cross-Domain-Policies"]).toBe("none");
    expect(res.headers["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
  });
});
