/** Verifies list selections survive refreshes until matching detail data is reconciled. */
import { beforeEach, describe, expect, it } from "vitest";
import type { PublicEvent, Room, ScheduleItem } from "@concourse/shared";
import {
  clearSelectedDetailRecords,
  reconcileSelectedDetailRecord,
  selectDetailRecord,
  selectedEventDetails,
  selectedRoomDetails,
  selectedScheduleDetails
} from "../selectedDetailRecords";

const event: PublicEvent = {
  id: "event-1",
  title: "Campus concert",
  date: "2026-07-14T18:00:00.000Z",
  sourceUrl: "https://example.org/events/1"
};
const room: Room = { id: "room-1", name: "Auditorium", campusId: "main" };
const scheduleItem: ScheduleItem = {
  id: "schedule-1",
  title: "Seminar",
  startsAt: "2026-07-14T09:00:00.000Z"
};

describe("selected detail record handoff", () => {
  beforeEach(clearSelectedDetailRecords);

  it("keeps schema-validated resource kinds isolated by ID", () => {
    expect(selectedEventDetails.remember(event)).toBe(true);
    expect(selectedRoomDetails.remember(room)).toBe(true);
    expect(selectedScheduleDetails.remember(scheduleItem)).toBe(true);

    expect(selectedEventDetails.get(event.id)).toEqual(event);
    expect(selectedRoomDetails.get(room.id)).toEqual(room);
    expect(selectedScheduleDetails.get(scheduleItem.id)).toEqual(scheduleItem);
    expect(selectedEventDetails.get(room.id)).toBeNull();
    expect(selectedEventDetails.remember({ id: "crafted", title: "Untrusted route payload" })).toBe(false);
  });

  it("supports offline navigation from Today and filtered list caches", () => {
    selectedEventDetails.remember(event);
    selectedRoomDetails.remember(room);
    selectedScheduleDetails.remember(scheduleItem);

    expect(selectDetailRecord(event.id, null, null, selectedEventDetails.get(event.id))).toEqual(event);
    expect(selectDetailRecord(event.id, [], "persisted-cache", selectedEventDetails.get(event.id))).toEqual(event);
    expect(selectDetailRecord(room.id, [], "memory-cache", selectedRoomDetails.get(room.id))).toEqual(room);
    expect(selectDetailRecord(scheduleItem.id, null, null, selectedScheduleDetails.get(scheduleItem.id))).toEqual(scheduleItem);
  });

  it("prefers a matching live record and treats live absence as authoritative", () => {
    const refreshed = { ...event, title: "Updated campus concert" };
    expect(selectDetailRecord(event.id, [refreshed], "network", event)).toEqual(refreshed);
    expect(selectDetailRecord(event.id, [], "network", event)).toBeNull();
    expect(selectDetailRecord("another-id", null, null, event)).toBeNull();
  });

  it("keeps a selected record through an incomplete degraded network response", () => {
    selectedEventDetails.remember(event);

    // The first render receives a network response, but it is explicitly
    // incomplete: retain the validated handoff record rather than showing a
    // false not-found state.
    expect(selectDetailRecord(event.id, [], "network", selectedEventDetails.get(event.id), true)).toEqual(event);
    reconcileSelectedDetailRecord(selectedEventDetails, event.id, [], "network", true);

    // A later remount can still recover the record from the selected-detail
    // store because degraded absence did not create a deletion tombstone.
    expect(selectDetailRecord(event.id, [], "persisted-cache", selectedEventDetails.get(event.id))).toEqual(event);
  });

  it("does not resurrect an authoritatively deleted record after an offline remount", () => {
    selectedEventDetails.remember(event);
    reconcileSelectedDetailRecord(selectedEventDetails, event.id, [], "network");

    expect(selectedEventDetails.get(event.id)).toBeNull();
    expect(selectedEventDetails.remember(event)).toBe(false);
    expect(selectDetailRecord(event.id, [], "persisted-cache", selectedEventDetails.get(event.id))).toBeNull();

    reconcileSelectedDetailRecord(selectedEventDetails, event.id, [event], "network");
    expect(selectedEventDetails.get(event.id)).toEqual(event);
  });

  it("bounds the process-local handoff store", () => {
    for (let index = 0; index <= 50; index += 1) {
      selectedEventDetails.remember({ ...event, id: `event-${index}` });
    }

    expect(selectedEventDetails.get("event-0")).toBeNull();
    expect(selectedEventDetails.get("event-50")?.id).toBe("event-50");
  });
});
