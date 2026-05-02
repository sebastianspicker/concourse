import { describe, expect, it } from "vitest";
import {
  PublicEventSchema,
  RoomSchema,
  ScheduleItemSchema,
  type PublicEvent,
  type Room,
  type ScheduleItem
} from "@campus/shared";
import { parseRouteItem, serializeRouteItem } from "../routeItem";

describe("route item serialization", () => {
  it("parses valid event payloads with the event schema", () => {
    const event: PublicEvent = {
      id: "event-1",
      title: "Public Concert",
      date: "2026-05-01T18:00:00.000Z",
      sourceUrl: "https://example.edu/events/event-1"
    };

    expect(parseRouteItem(serializeRouteItem(event), PublicEventSchema)).toEqual(event);
  });

  it("parses valid room payloads with the room schema", () => {
    const room: Room = {
      id: "room-1",
      name: "Room 101",
      campusId: "campus-main"
    };

    expect(parseRouteItem(serializeRouteItem(room), RoomSchema)).toEqual(room);
  });

  it("parses valid schedule payloads with the schedule schema", () => {
    const scheduleItem: ScheduleItem = {
      id: "schedule-1",
      title: "Ensemble Rehearsal",
      startsAt: "2026-05-01T16:00:00.000Z",
      endsAt: "2026-05-01T17:30:00.000Z",
      location: "Room 101",
      campusId: "campus-main"
    };

    expect(parseRouteItem(serializeRouteItem(scheduleItem), ScheduleItemSchema)).toEqual(scheduleItem);
  });

  it("returns null for malformed JSON", () => {
    expect(parseRouteItem("{not-json", PublicEventSchema)).toBeNull();
  });

  it("returns null for schema-invalid payloads even when the id matches", () => {
    const invalidEvent = {
      id: "event-1",
      title: "Forged Event",
      date: "not-a-date",
      sourceUrl: "not-a-url"
    };

    expect(parseRouteItem(JSON.stringify(invalidEvent), PublicEventSchema)).toBeNull();
  });
});
