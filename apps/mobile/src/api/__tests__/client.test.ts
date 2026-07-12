import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getJson } from "../client";
import { clearCache } from "../../data/cache";
import { _resetBffBaseUrlMemoForTests } from "../../utils/bffConfig";

describe("getJson", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "http://localhost:4000";
    _resetBffBaseUrlMemoForTests();
    clearCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_BFF_BASE_URL;
  });

  it("fetches and returns parsed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ items: [1, 2] }),
      headers: { get: () => null },
    }));

    const result = await getJson<{ items: number[] }>("/test");
    expect(result).toEqual({ items: [1, 2] });
  });

  it("applies custom parse function", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ value: 42 }),
      headers: { get: () => null },
    }));

    const result = await getJson<number>("/test", (data) => {
      const obj = data as { value: number };
      return obj.value;
    });
    expect(result).toBe(42);
  });

  it("constructs URL from BFF base URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "{}",
      headers: { get: () => null },
    });
    vi.stubGlobal("fetch", mockFetch);

    await getJson("/events");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4000/events",
      expect.objectContaining({ signal: expect.anything() })
    );
  });

  it("throws ApiErrorException on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ error: { code: "not_found", message: "Not found" } }),
      json: async () => ({ error: { code: "not_found", message: "Not found" } }),
      headers: { get: () => null },
    }));

    await expect(getJson("/missing")).rejects.toThrow();
  });

  it("rejects a BFF configured for a different institution", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "{}",
      headers: { get: (name: string) => name === "x-institution-id" ? "other" : null },
    }));

    await expect(getJson("/events")).rejects.toMatchObject({
      code: "institution_mismatch",
      status: 409,
    });
  });
});
