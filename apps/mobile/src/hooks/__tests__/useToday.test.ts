import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "./testUtils";
import { useToday } from "../useToday";
import { clearCache } from "../../data/cache";
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
  beforeEach(() => {
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "http://localhost:4000";
    _resetBffBaseUrlMemoForTests();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockToday),
      headers: { get: () => null },
    }));
    clearCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_BFF_BASE_URL;
  });

  it("loads today", async () => {
    const { getResult, flush, unmount } = renderHook(useToday);

    expect(getResult().loading).toBe(true);
    await flush();

    expect(getResult().loading).toBe(false);
    expect(getResult().data?.events.length).toBe(1);
    unmount();
  });
});
