/** Verifies Today helpers select the active or next schedule item and freshness timestamp. */
import { describe, expect, it } from "vitest";
import type { ScheduleItem } from "@concourse/shared";
import { getCurrentOrNextScheduleId, getTodayFreshnessUpdatedAt } from "../todayScreenHelpers";

const schedule: ScheduleItem[] = [
  {
    id: "past",
    title: "Past session",
    startsAt: "2026-09-14T08:00:00.000Z",
    endsAt: "2026-09-14T09:00:00.000Z",
  },
  {
    id: "current",
    title: "Current session",
    startsAt: "2026-09-14T10:00:00.000Z",
    endsAt: "2026-09-14T11:30:00.000Z",
  },
  {
    id: "next",
    title: "Next session",
    startsAt: "2026-09-14T12:00:00.000Z",
  },
];

describe("getCurrentOrNextScheduleId", () => {
  it("prefers an in-progress item", () => {
    expect(getCurrentOrNextScheduleId(schedule, new Date("2026-09-14T10:30:00.000Z"))).toBe("current");
  });

  it("selects the chronologically next item independently of input order", () => {
    expect(getCurrentOrNextScheduleId([...schedule].reverse(), new Date("2026-09-14T11:45:00.000Z"))).toBe("next");
  });

  it("returns no marker after the final item", () => {
    expect(getCurrentOrNextScheduleId(schedule, new Date("2026-09-15T08:00:00.000Z"))).toBeUndefined();
  });
});

describe("getTodayFreshnessUpdatedAt", () => {
  it("uses the oldest visible network result", () => {
    expect(getTodayFreshnessUpdatedAt(
      { source: "network", updatedAt: 200 },
      { source: "network", updatedAt: 100 },
      false
    )).toBe(100);
  });

  it("hides freshness when a visible resource is cached", () => {
    expect(getTodayFreshnessUpdatedAt(
      { source: "network", updatedAt: 200 },
      { source: "persisted-cache", updatedAt: 100 },
      false
    )).toBeNull();
  });
});
