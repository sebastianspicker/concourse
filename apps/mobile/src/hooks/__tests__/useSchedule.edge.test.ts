import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "./testUtils";
import { useSchedule } from "../useSchedule";
import { clearCache } from "../../data/cache";
import { clearPersistedCache } from "../../data/persistedCache";
import { _resetBffBaseUrlMemoForTests } from "../../utils/bffConfig";

describe("useSchedule — edge cases", () => {
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

    const { getResult, flush, unmount } = renderHook(useSchedule);

    await flush();

    expect(getResult().loading).toBe(false);
    expect(getResult().error).toBeTruthy();
    expect(getResult().data).toBeNull();
    unmount();
  });

  it("returns empty schedule array without crashing on empty response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ schedule: [] }),
      headers: { get: () => null },
    }));

    const { getResult, flush, unmount } = renderHook(useSchedule);

    await flush();

    expect(getResult().loading).toBe(false);
    expect(getResult().data?.schedule).toEqual([]);
    expect(getResult().error).toBeNull();
    unmount();
  });

  it("does not produce state update warning on unmount during pending fetch", async () => {
    let resolvePromise!: (value: unknown) => void;
    const pendingFetch = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => pendingFetch));

    const { getResult, unmount } = renderHook(useSchedule);

    expect(getResult().loading).toBe(true);
    unmount();

    // Resolve after unmount — should not cause state update warnings
    resolvePromise({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ schedule: [] }),
      headers: { get: () => null },
    });
  });

  it("handles non-retryable error response", async () => {
    // Use 400 status which is not retryable (retry only happens for 429 and 500+)
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: { code: "bad_request", message: "Bad request" } }),
      json: async () => ({ error: { code: "bad_request", message: "Bad request" } }),
      headers: { get: () => null },
    }));

    const { getResult, flush, unmount } = renderHook(useSchedule);

    await flush();

    expect(getResult().loading).toBe(false);
    expect(getResult().error).toBeTruthy();
    unmount();
  });
});
