/** Verifies event, room, and schedule cards produce typed navigable detail routes. */
import { describe, expect, it } from "vitest";

import { getEventHref as getTodayEventHref, getScheduleHref } from "../todayScreenHelpers";
import { getEventHref } from "../eventsScreenHelpers";
import { getRoomHref } from "../roomsScreenHelpers";

describe("resource detail hrefs", () => {
  it.each([getEventHref, getTodayEventHref])("routes events by authoritative ID only", (hrefForEvent) => {
    const href = hrefForEvent({ id: "event-1", title: "Event", date: "2026-07-14T09:00:00Z", sourceUrl: "https://example.org" });
    expect(href).toEqual({ pathname: "/events/[id]", params: { id: "event-1" } });
  });

  it("routes schedule items and rooms by authoritative ID only", () => {
    expect(getScheduleHref({ id: "schedule-1", title: "Lesson", startsAt: "2026-07-14T09:00:00Z" })).toEqual({
      pathname: "/schedule/[id]",
      params: { id: "schedule-1" }
    });
    expect(getRoomHref({ id: "room-1", name: "Room", campusId: "main" })).toEqual({
      pathname: "/rooms/[id]",
      params: { id: "room-1" }
    });
  });
});
