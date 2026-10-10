import { describe, expect, it } from "vitest";
import {
  SCHEDULE_DESCRIPTION_MAX_LENGTH,
  SCHEDULE_ID_MAX_LENGTH,
  SCHEDULE_TITLE_MAX_LENGTH
} from "@concourse/contracts";
import { parseIcs } from "./icsParser";

const calendar = (event: string) => `BEGIN:VCALENDAR\nBEGIN:VEVENT\n${event}\nEND:VEVENT\nEND:VCALENDAR`;

const calendarOf = (events: string[]) => `BEGIN:VCALENDAR\n${events.map((event) => `BEGIN:VEVENT\n${event}\nEND:VEVENT`).join("\n")}\nEND:VCALENDAR`;

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

  it("rejects recurrence intervals that cannot make forward progress", () => {
    const [event] = parseIcs(calendar(
      "UID:negative-interval\nSUMMARY:Safe fallback\nDTSTART:20260202T140000Z\nRRULE:FREQ=DAILY;INTERVAL=-1"
    ), { referenceDate: new Date("2026-02-01T00:00:00.000Z") });

    expect(event).toMatchObject({ id: "negative-interval", title: "Safe fallback" });
    expect(event.isRecurring).toBeUndefined();
  });

  it("rejects filters whose dependency search is not horizon-bounded", () => {
    const [event] = parseIcs(calendar(
      "UID:impossible-filter\nSUMMARY:Safe fallback\nDTSTART:20260202T140000Z\nRRULE:FREQ=HOURLY;BYMONTH=2;BYMONTHDAY=30"
    ), { referenceDate: new Date("2026-02-01T00:00:00.000Z") });

    expect(event).toMatchObject({ id: "impossible-filter", title: "Safe fallback" });
    expect(event.isRecurring).toBeUndefined();
  });

  it("retains bounded weekly weekday recurrence", () => {
    const events = parseIcs(calendar(
      "UID:weekday-series\nSUMMARY:Workshop\nDTSTART:20260202T140000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=4"
    ), { referenceDate: new Date("2026-02-01T00:00:00.000Z"), rruleHorizonDays: 30 });

    expect(events).toHaveLength(4);
    expect(events.every((event) => event.isRecurring)).toBe(true);
  });

  it("retains the same highest-priority events across input orders near the output limit", () => {
    const referenceDate = new Date("2026-06-01T00:00:00.000Z");
    const inputs = Array.from({ length: 1_004 }, (_, index) => {
      const startsAt = new Date(referenceDate.getTime() - 502 * 60_000 + Math.floor(index / 2) * 60_000)
        .toISOString().replaceAll(/[-:]/g, "").replace(".000Z", "Z");
      return `UID:event-${String(index).padStart(4, "0")}\nSUMMARY:Shared ${index % 3}\nDTSTART:${startsAt}`;
    });
    const alternating = Array.from({ length: inputs.length }, (_, index) =>
      inputs[index % 2 === 0 ? index / 2 : inputs.length - 1 - Math.floor(index / 2)]!
    );
    const parse = (ordered: string[]) => parseIcs(calendarOf(ordered), { maxTotalEvents: 1_000, referenceDate });

    const ascending = parse(inputs);
    expect(parse([...inputs].reverse())).toEqual(ascending);
    expect(parse(alternating)).toEqual(ascending);
    expect(ascending).toHaveLength(1_000);
  });
});
