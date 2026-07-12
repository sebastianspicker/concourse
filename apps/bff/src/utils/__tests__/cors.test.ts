import { describe, expect, it } from "vitest";
import { getCorsHeaders } from "../cors";

describe("getCorsHeaders", () => {
  it("returns empty headers when no origins are configured", () => {
    expect(getCorsHeaders("https://example.com", [])).toEqual({});
  });

  it("returns wildcard when * is in allowed origins", () => {
    const headers = getCorsHeaders("https://example.com", ["*"]);
    expect(headers["access-control-allow-origin"]).toBe("*");
    expect(headers).not.toHaveProperty("vary");
  });

  it("returns request origin when it matches allowed origins", () => {
    const headers = getCorsHeaders("https://app.example.com", [
      "https://app.example.com",
      "https://other.example.com"
    ]);
    expect(headers["access-control-allow-origin"]).toBe("https://app.example.com");
    expect(headers["vary"]).toBe("origin");
  });

  it("returns empty headers when request origin is not in allowed list", () => {
    const headers = getCorsHeaders("https://evil.com", [
      "https://app.example.com"
    ]);
    expect(headers).toEqual({});
  });

  it("returns empty headers when request origin is undefined", () => {
    const headers = getCorsHeaders(undefined, ["https://app.example.com"]);
    expect(headers).toEqual({});
  });

  it("includes allow-methods and allow-headers", () => {
    const headers = getCorsHeaders("https://app.example.com", [
      "https://app.example.com"
    ]);
    expect(headers["access-control-allow-methods"]).toBe("GET, OPTIONS");
    expect(headers["access-control-allow-headers"]).toBe("content-type, authorization");
    expect(headers["access-control-expose-headers"]).toContain("x-institution-id");
  });
});
