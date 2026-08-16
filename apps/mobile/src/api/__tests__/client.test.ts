/** Verifies the API client normalizes response payloads and HTTP failures. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getJson, getJsonResult } from "../client";
import { clearCache } from "../../data/cache";
import { jsonResponse } from "../../test/httpResponse";
import { _resetBffBaseUrlMemoForTests } from "../../utils/bffConfig";

describe("getJson", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "http://localhost:4000";
    (globalThis as { __DEV__?: unknown }).__DEV__ = true;
    _resetBffBaseUrlMemoForTests();
    clearCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_BFF_BASE_URL;
    delete (globalThis as { __DEV__?: unknown }).__DEV__;
  });

  it("fetches and returns parsed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ items: [1, 2] })));

    const result = await getJson<{ items: number[] }>("/test");
    expect(result).toEqual({ items: [1, 2] });
  });

  it("applies custom parse function", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ value: 42 })));

    const result = await getJson<number>("/test", (data) => {
      const obj = data as { value: number };
      return obj.value;
    });
    expect(result).toBe(42);
  });

  it("constructs URL from BFF base URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", mockFetch);

    await getJson("/events");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4000/events",
      expect.objectContaining({ signal: expect.anything() })
    );
  });

  it("preserves the matching institution response metadata", async () => {
    const getHeader = (name: string) => name === "x-institution-id" ? "example" : null;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ items: [] }, 200, getHeader)));

    await expect(getJsonResult<{ items: unknown[] }>("/events")).resolves.toEqual({
      data: { items: [] },
      institutionId: "example"
    });
  });

  it("throws ApiErrorException on non-ok response", async () => {
    const body = { error: { code: "not_found", message: "Not found" } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body, 404)));

    await expect(getJson("/missing")).rejects.toThrow();
  });

  it("rejects a BFF configured for a different institution", async () => {
    const getHeader = (name: string) => name === "x-institution-id" ? "other" : null;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 200, getHeader)));

    await expect(getJson("/events")).rejects.toMatchObject({
      code: "institution_mismatch",
      status: 409,
    });
  });

  it.each(["https://attacker.example/events", "//attacker.example/events"])(
    "rejects a request path that escapes the configured origin: %s",
    async (path) => {
      vi.stubGlobal("fetch", vi.fn());

      await expect(getJson(path)).rejects.toThrow(
        "BFF request path must remain within the configured origin",
      );
    },
  );

  it("requires the exact institution response header in a release build", async () => {
    (globalThis as { __DEV__?: unknown }).__DEV__ = false;
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "https://api.example.test";
    _resetBffBaseUrlMemoForTests();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ items: [] })));

    await expect(getJson("/events")).rejects.toMatchObject({
      code: "institution_mismatch",
      status: 409,
    });
  });
});
