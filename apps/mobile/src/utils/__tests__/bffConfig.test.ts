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

    expect(() => resolveBffBaseUrl()).toThrow("Invalid BFF base URL protocol");
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
