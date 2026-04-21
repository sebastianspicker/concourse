import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "./testUtils";
import { useRooms } from "../useRooms";
import { clearCache } from "../../data/cache";
import { clearPersistedCache } from "../../data/persistedCache";
import { _resetBffBaseUrlMemoForTests } from "../../utils/bffConfig";

describe("useRooms — edge cases", () => {
  beforeEach(async () => {
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "http://localhost:4000";
    _resetBffBaseUrlMemoForTests();
    clearCache();
    await clearPersistedCache();
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_BFF_BASE_URL;
    await clearPersistedCache();
  });

  it("returns error state on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const { getResult, flush, unmount } = renderHook(useRooms);

    await flush();

    expect(getResult().loading).toBe(false);
    expect(getResult().error).toBeTruthy();
    expect(getResult().data).toBeNull();
    unmount();
  });

  it("returns empty rooms array without crashing on empty response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ rooms: [] }),
      headers: { get: () => null },
    }));

    const { getResult, flush, unmount } = renderHook(useRooms);

    await flush();

    expect(getResult().loading).toBe(false);
    expect(getResult().data?.rooms).toEqual([]);
    expect(getResult().error).toBeNull();
    unmount();
  });

  it("does not produce state update warning on unmount during pending fetch", async () => {
    let resolvePromise!: (value: unknown) => void;
    const pendingFetch = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => pendingFetch));

    const { getResult, unmount } = renderHook(useRooms);

    expect(getResult().loading).toBe(true);
    unmount();

    // Resolve after unmount — should not cause state update warnings
    resolvePromise({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ rooms: [] }),
      headers: { get: () => null },
    });
  });

  it("handles 404 response from server", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ error: { code: "not_found", message: "Not found" } }),
      json: async () => ({ error: { code: "not_found", message: "Not found" } }),
      headers: { get: () => null },
    }));

    const { getResult, flush, unmount } = renderHook(useRooms);

    await flush();

    expect(getResult().loading).toBe(false);
    expect(getResult().error).toBeTruthy();
    unmount();
  });
});
