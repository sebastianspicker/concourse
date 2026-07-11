import { describe, expect, it } from "vitest";
import { sortEventsByDate } from "../eventsScreenHelpers";
import { getRoomCard } from "../roomsScreenHelpers";
import { getLocalDayRange, sortScheduleItems } from "../todayScreenHelpers";

describe("screen helper intent", () => {
  it("sorts events without mutating the source array", () => {
    const events = [{ id: "late", title: "Late", date: "2026-07-11T10:00:00.000Z", sourceUrl: "https://example.test" }, { id: "early", title: "Early", date: "2026-07-10T10:00:00.000Z", sourceUrl: "https://example.test" }];
    expect(sortEventsByDate(events, "asc").map((event) => event.id)).toEqual(["early", "late"]);
    expect(events.map((event) => event.id)).toEqual(["late", "early"]);
  });

  it("keeps room campus labels and handles missing campuses", () => {
    expect(getRoomCard({ id: "r1", name: "Studio", campusId: "north-campus" })).toEqual({ title: "Studio", subtitle: "North Campus" });
    expect(getRoomCard({ id: "r2", name: "Hall", campusId: "" })).toEqual({ title: "Hall", subtitle: undefined });
  });

  it("builds one local calendar-day range", () => {
    const range = getLocalDayRange();
    expect(new Date(range.from).getHours()).toBe(0);
    expect(new Date(range.to).getHours()).toBe(23);
  });

  it("sorts schedule items by requested direction", () => {
    const items = [{ id: "later", title: "Later", startsAt: "2026-07-10T12:00:00.000Z" }, { id: "first", title: "First", startsAt: "2026-07-10T08:00:00.000Z" }];
    expect(sortScheduleItems(items, "desc").map((item) => item.id)).toEqual(["later", "first"]);
  });
});
