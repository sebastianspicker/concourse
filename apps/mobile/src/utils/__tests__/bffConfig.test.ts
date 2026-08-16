/** Verifies BFF origin configuration rejects invalid URLs and memoizes valid deployment settings. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveBffBaseUrl, _resetBffBaseUrlMemoForTests } from "../bffConfig";

type EnvSnapshot = {
  expoPublic?: string;
  nodeEnv?: string;
};

function setEnv(value: string | undefined, key: keyof EnvSnapshot): void {
  const envKey = key === "expoPublic" ? "EXPO_PUBLIC_BFF_BASE_URL" : "NODE_ENV";
  if (value === undefined) {
    delete process.env[envKey];
  } else {
    process.env[envKey] = value;
  }
}

describe("resolveBffBaseUrl", () => {
  let originalEnv: EnvSnapshot;
  let originalDev: unknown;
  let hadDev: boolean;

  beforeEach(() => {
    _resetBffBaseUrlMemoForTests();
    originalEnv = {
      expoPublic: process.env.EXPO_PUBLIC_BFF_BASE_URL,
      nodeEnv: process.env.NODE_ENV,
    };
    hadDev = Object.prototype.hasOwnProperty.call(globalThis, "__DEV__");
    originalDev = (globalThis as { __DEV__?: unknown }).__DEV__;
  });

  afterEach(() => {
    setEnv(originalEnv.expoPublic, "expoPublic");
    setEnv(originalEnv.nodeEnv, "nodeEnv");

    if (hadDev) {
      (globalThis as { __DEV__?: unknown }).__DEV__ = originalDev;
    } else {
      delete (globalThis as { __DEV__?: unknown }).__DEV__;
    }
  });

  it("prefers EXPO_PUBLIC_BFF_BASE_URL and normalizes trailing slashes", () => {
    setEnv("https://api.example.com/", "expoPublic");
    (globalThis as { __DEV__?: unknown }).__DEV__ = false;

    expect(resolveBffBaseUrl()).toBe("https://api.example.com");
  });

  it("rejects invalid protocols", () => {
    setEnv("ftp://example.com", "expoPublic");
    (globalThis as { __DEV__?: unknown }).__DEV__ = false;

    expect(() => resolveBffBaseUrl()).toThrow("BFF base URL must use HTTPS");
  });

  it.each([
    "http://api.example.com",
    "https://user:pass@api.example.com",
    "https://localhost",
    "https://localhost.",
    "https://127.1",
    "https://0x7f000001",
    "https://10.0.0.1",
    "https://100.64.0.1",
    "https://169.254.1.1",
    "https://[fc00::1]",
    "https://[fe80::1]",
  ])("rejects release origin %s", (baseUrl) => {
    setEnv(baseUrl, "expoPublic");
    (globalThis as { __DEV__?: unknown }).__DEV__ = false;

    expect(() => resolveBffBaseUrl()).toThrow();
  });

  it("allows only loopback HTTP in development", () => {
    setEnv("http://localhost:4000/", "expoPublic");
    (globalThis as { __DEV__?: unknown }).__DEV__ = true;

    expect(resolveBffBaseUrl()).toBe("http://localhost:4000");

    _resetBffBaseUrlMemoForTests();
    setEnv("http://api.example.com", "expoPublic");
    expect(() => resolveBffBaseUrl()).toThrow("BFF base URL must use HTTPS");
  });

  it.each(["https://fc.example.test", "https://fd.example.test"])(
    "allows a normal release DNS hostname beginning with %s",
    (baseUrl) => {
      setEnv(baseUrl, "expoPublic");
      (globalThis as { __DEV__?: unknown }).__DEV__ = false;

      expect(resolveBffBaseUrl()).toBe(baseUrl);
    },
  );

  it("rejects a path, query, or fragment in the configured origin", () => {
    setEnv("https://api.example.com/events", "expoPublic");
    (globalThis as { __DEV__?: unknown }).__DEV__ = false;

    expect(() => resolveBffBaseUrl()).toThrow("must be an origin");
  });

  it("throws in development without a base URL", () => {
    setEnv(undefined, "expoPublic");
    (globalThis as { __DEV__?: unknown }).__DEV__ = true;

    expect(() => resolveBffBaseUrl()).toThrow("Missing BFF base URL");
  });

  it("throws in production without a base URL", () => {
    setEnv(undefined, "expoPublic");
    setEnv("production", "nodeEnv");
    (globalThis as { __DEV__?: unknown }).__DEV__ = false;

    expect(() => resolveBffBaseUrl()).toThrow("Missing BFF base URL");
  });
});
