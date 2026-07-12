import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("BFF_ENV", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("requires INSTITUTION_ID", async () => {
    delete process.env.INSTITUTION_ID;
    await expect(import("../env")).rejects.toThrow("INSTITUTION_ID is required");
  });

  it("uses default port 4000 when BFF_PORT not set", async () => {
    process.env.INSTITUTION_ID = "test";
    delete process.env.BFF_PORT;
    const { BFF_ENV } = await import("../env");
    expect(BFF_ENV.port).toBe(4000);
  });

  it("parses valid BFF_PORT", async () => {
    process.env.INSTITUTION_ID = "test";
    process.env.BFF_PORT = "8080";
    const { BFF_ENV } = await import("../env");
    expect(BFF_ENV.port).toBe(8080);
  });

  it("parses BFF_PORT with surrounding whitespace", async () => {
    process.env.INSTITUTION_ID = "test";
    process.env.BFF_PORT = " 8080 ";
    const { BFF_ENV } = await import("../env");
    expect(BFF_ENV.port).toBe(8080);
  });

  it("rejects invalid BFF_PORT", async () => {
    process.env.INSTITUTION_ID = "test";
    process.env.BFF_PORT = "not-a-number";
    await expect(import("../env")).rejects.toThrow("Invalid BFF_PORT");
  });

  it("rejects out-of-range BFF_PORT", async () => {
    process.env.INSTITUTION_ID = "test";
    process.env.BFF_PORT = "99999";
    await expect(import("../env")).rejects.toThrow("Invalid BFF_PORT");
  });

  it("rejects partial numeric BFF_PORT values", async () => {
    process.env.INSTITUTION_ID = "test";
    process.env.BFF_PORT = "4000x";
    await expect(import("../env")).rejects.toThrow("Invalid BFF_PORT");
  });

  it("parses CORS_ORIGINS as CSV", async () => {
    process.env.INSTITUTION_ID = "test";
    process.env.CORS_ORIGINS = "https://a.com, https://b.com , https://c.com";
    const { BFF_ENV } = await import("../env");
    expect(BFF_ENV.corsOrigins).toEqual(["https://a.com", "https://b.com", "https://c.com"]);
  });

  it("returns empty array when CORS_ORIGINS not set", async () => {
    process.env.INSTITUTION_ID = "test";
    delete process.env.CORS_ORIGINS;
    const { BFF_ENV } = await import("../env");
    expect(BFF_ENV.corsOrigins).toEqual([]);
  });

  it.each([
    ["auto", "auto"],
    ["always", "always"],
    ["true", "always"],
    ["1", "always"],
    ["never", "never"],
    ["false", "never"],
    ["0", "never"]
  ] as const)("parses BFF_TRUST_PROXY=%s as %s", async (raw, expected) => {
    process.env.INSTITUTION_ID = "test";
    process.env.BFF_TRUST_PROXY = raw;

    const { BFF_ENV } = await import("../env");

    expect(BFF_ENV.trustProxy).toBe(expected);
  });

  it("defaults trustProxy to never", async () => {
    process.env.INSTITUTION_ID = "test";
    delete process.env.BFF_TRUST_PROXY;
    const { BFF_ENV } = await import("../env");
    expect(BFF_ENV.trustProxy).toBe("never");
  });

  it("defaults cache TTL to 300s", async () => {
    process.env.INSTITUTION_ID = "test";
    delete process.env.BFF_DEFAULT_CACHE_TTL;
    const { BFF_ENV } = await import("../env");
    expect(BFF_ENV.defaultCacheTtl).toBe(300);
  });

  it("rejects partial numeric cache TTL values", async () => {
    process.env.INSTITUTION_ID = "test";
    process.env.BFF_DEFAULT_CACHE_TTL = "300s";
    await expect(import("../env")).rejects.toThrow("BFF_DEFAULT_CACHE_TTL must be an integer");
  });

  it("rejects out-of-range cache TTL values", async () => {
    process.env.INSTITUTION_ID = "test";
    process.env.BFF_DEFAULT_CACHE_TTL = "-1";
    await expect(import("../env")).rejects.toThrow("BFF_DEFAULT_CACHE_TTL must be between 1 and 86400");
  });

  it("rejects zero RRULE expansion horizon", async () => {
    process.env.INSTITUTION_ID = "test";
    process.env.RRULE_EXPANSION_HORIZON_DAYS = "0";
    await expect(import("../env")).rejects.toThrow("RRULE_EXPANSION_HORIZON_DAYS must be between 1 and 366");
  });
});
