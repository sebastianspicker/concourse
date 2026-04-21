import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "./testUtils";
import { useSchedule } from "../useSchedule";
import { clearCache } from "../../data/cache";
import { _resetBffBaseUrlMemoForTests } from "../../utils/bffConfig";

const mockSchedule = {
  schedule: [
    {
      id: "schedule-1",
      title: "Jazz Ensemble",
      startsAt: "2020-01-01T10:00:00.000Z",
      endsAt: "2020-01-01T12:00:00.000Z",
      location: "A-101",
      campusId: "cologne"
    }
  ]
};

describe("useSchedule", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "http://localhost:4000";
    _resetBffBaseUrlMemoForTests();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockSchedule),
      headers: { get: () => null },
    }));
    clearCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_BFF_BASE_URL;
  });

  it("loads schedule", async () => {
    const { getResult, flush, unmount } = renderHook(useSchedule);

    expect(getResult().loading).toBe(true);
    await flush();

    expect(getResult().loading).toBe(false);
    expect(getResult().data?.schedule.length).toBe(1);
    unmount();
  });
});
