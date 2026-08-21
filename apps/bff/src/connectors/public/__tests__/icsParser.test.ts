import { describe, expect, it } from "vitest";
import { parseIcs } from "../icsParser";

const calendar = (event: string) => `BEGIN:VCALENDAR\nBEGIN:VEVENT\n${event}\nEND:VEVENT\nEND:VCALENDAR`;

describe("parseIcs", () => {
  it("normalizes public event fields without external fixture data", () => {
    expect(parseIcs(calendar("UID:event-1\nSUMMARY:Open\\, Lecture\nDTSTART:20260101T100000Z\nDTEND:20260101T110000Z\nLOCATION:Room \\; 101"))).toEqual([{
      id: "event-1", title: "Open, Lecture", startsAt: "2026-01-01T10:00:00.000Z",
      endsAt: "2026-01-01T11:00:00.000Z", location: "Room ; 101", campusId: undefined
    }]);
  });

  it("bounds recurring events and gives each occurrence a stable identity", () => {
    const events = parseIcs(calendar("UID:weekly\nSUMMARY:Seminar\nDTSTART:20260202T140000Z\nRRULE:FREQ=DAILY;COUNT=3"), { rruleHorizonDays: 30 });
    expect(events).toHaveLength(3);
    expect(new Set(events.map((event) => event.id)).size).toBe(3);
    expect(events.every((event) => event.isRecurring)).toBe(true);
  });

  it("rejects occurrences explicitly removed with EXDATE", () => {
    expect(parseIcs(calendar("UID:cancelled\nSUMMARY:Cancelled\nDTSTART:20260201T100000Z\nRRULE:FREQ=DAILY;COUNT=1\nEXDATE:20260201T100000Z"), { referenceDate: new Date("2026-01-01T00:00:00.000Z") })).toEqual([]);
  });
});
