import { describe, expect, it } from "vitest";
import {
  SCHEDULE_DESCRIPTION_MAX_LENGTH,
  SCHEDULE_ID_MAX_LENGTH,
  SCHEDULE_TITLE_MAX_LENGTH
} from "@concourse/contracts";
import { parseIcs } from "./icsParser";

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

  it("bounds large text before recurrence expansion copies it into every occurrence", () => {
    const description = "D".repeat(60 * 1024);
    const events = Array.from({ length: 15 }, (_, index) => [
      "BEGIN:VEVENT",
      `UID:${"u".repeat(SCHEDULE_ID_MAX_LENGTH + 1)}-${index}`,
      `SUMMARY:${"S".repeat(SCHEDULE_TITLE_MAX_LENGTH + 1)}`,
      "DTSTART:20260101T100000Z",
      `DESCRIPTION:${description}`,
      "RRULE:FREQ=DAILY;COUNT=100",
      "END:VEVENT"
    ].join("\n"));
    const ics = `BEGIN:VCALENDAR\n${events.join("\n")}\nEND:VCALENDAR`;

    const parsed = parseIcs(ics, {
      referenceDate: new Date("2026-01-01T00:00:00.000Z"),
      rruleHorizonDays: 120
    });

    expect(ics.length).toBeGreaterThan(900 * 1024);
    expect(parsed).toHaveLength(1000);
    expect(parsed.every((event) => event.description?.length === SCHEDULE_DESCRIPTION_MAX_LENGTH)).toBe(true);
    expect(parsed.every((event) => event.title.length === SCHEDULE_TITLE_MAX_LENGTH)).toBe(true);
    expect(parsed.every((event) => event.id.length <= SCHEDULE_ID_MAX_LENGTH)).toBe(true);
  });

  it("does not retain a dangling UTF-16 surrogate when truncating schedule text", () => {
    const title = `${"S".repeat(SCHEDULE_TITLE_MAX_LENGTH - 1)}😀`;

    const [event] = parseIcs(calendar(`UID:utf-16-boundary\nSUMMARY:${title}\nDTSTART:20260101T100000Z`));

    expect(event.title).toBe("S".repeat(SCHEDULE_TITLE_MAX_LENGTH - 1));
    expect(event.title).not.toContain("\uFFFD");
  });
});
