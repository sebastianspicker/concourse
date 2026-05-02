import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "./testUtils";
import { useToday } from "../useToday";
import { clearCache } from "../../data/cache";
import { clearPersistedCache } from "../../data/persistedCache";
import { _resetBffBaseUrlMemoForTests } from "../../utils/bffConfig";

const mockToday = {
  events: [
    {
      id: "event-1",
      title: "Public Event",
      date: "2020-01-01T00:00:00.000Z",
      sourceUrl: "https://example.org/events"
    }
  ],
  rooms: []
};

describe("useToday", () => {
  beforeEach(async () => {
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "http://localhost:4000";
    _resetBffBaseUrlMemoForTests();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockToday),
      headers: { get: () => null },
    }));
    clearCache();
    await clearPersistedCache();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_BFF_BASE_URL;
    await clearPersistedCache();
  });

  it("loads today", async () => {
    const { getResult, flush, unmount } = renderHook(useToday);
    const now = new Date();
    const expectedDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");

    expect(getResult().loading).toBe(true);
    await flush();

    expect(getResult().loading).toBe(false);
    expect(getResult().data?.events.length).toBe(1);
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toContain("/today");
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toContain(`date=${expectedDate}`);
    unmount();
  });
});
