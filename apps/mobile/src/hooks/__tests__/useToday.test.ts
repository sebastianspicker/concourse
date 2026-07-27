/** Verifies Today reloads date-scoped resources and schedules campus-midnight rollover. */
import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { defineResourceSuccessCase } from "./resourceTestCases";
import { renderHook } from "./testUtils";
import { useToday } from "../useToday";
import type { TodayResponse } from "../../api/types";
import { getCampusDate } from "../../utils/campusTime";
import { getInstitutionTimeZone } from "../../config/institution";

const mockToday: TodayResponse = {
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
  defineResourceSuccessCase({
    assertLoaded: (data) => {
      const expectedDate = getCampusDate(new Date(), getInstitutionTimeZone());
      expect(data?.events.length).toBe(1);
      expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toContain("/today");
      expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toContain(`date=${expectedDate}`);
    },
    body: mockToday,
    hook: useToday,
    testName: "loads today",
  });

  it("keys the request to the configured institution day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-31T23:30:00.000Z"));
    const { unmount } = renderHook(useToday);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toContain("date=2026-02-01");
    unmount();
  });
});
