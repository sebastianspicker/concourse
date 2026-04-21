import { describe, expect, it } from "vitest";
import { parseIcs } from "../icsParser";

describe("parseIcs — adversarial edge cases", () => {
  it("returns empty array for empty string", () => {
    expect(parseIcs("")).toEqual([]);
  });

  it("returns empty array for garbage input", () => {
    expect(parseIcs("this is not an ics file at all\nrandom\nlines")).toEqual([]);
  });

  it("returns empty array for binary-like content", () => {
    expect(parseIcs("\x00\x01\x02\xFF\xFE")).toEqual([]);
  });

  it("skips events missing SUMMARY", () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:no-summary
DTSTART:20260101T100000Z
END:VEVENT
END:VCALENDAR`;
    expect(parseIcs(ics)).toEqual([]);
  });

  it("skips events missing DTSTART", () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:no-dtstart
SUMMARY:Missing Start
END:VEVENT
END:VCALENDAR`;
    expect(parseIcs(ics)).toEqual([]);
  });

  it("skips events with invalid date in DTSTART", () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:bad-date
SUMMARY:Bad Date
DTSTART:not-a-date
END:VEVENT
END:VCALENDAR`;
    expect(parseIcs(ics)).toEqual([]);
  });

  it("handles DTSTART with TZID parameter", () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:tzid-test
SUMMARY:Berlin Event
DTSTART;TZID=Europe/Berlin:20260615T140000
END:VEVENT
END:VCALENDAR`;
    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].startsAt).toBe("2026-06-15T12:00:00.000Z");
  });

  it("handles DTSTART with explicit numeric offset", () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:offset-test
SUMMARY:Offset Event
DTSTART:20260615T140000+0200
END:VEVENT
END:VCALENDAR`;
    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].startsAt).toBe("2026-06-15T12:00:00.000Z");
  });

  it("handles DTSTART with VALUE=DATE parameter", () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:value-date
SUMMARY:Date Only
DTSTART;VALUE=DATE:20260615
END:VEVENT
END:VCALENDAR`;
    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].startsAt).toBe("2026-06-15T00:00:00.000Z");
  });

  it("handles values with colons (timestamps)", () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:colon-value
SUMMARY:Event: Important Meeting
DTSTART:20260101T100000Z
END:VEVENT
END:VCALENDAR`;
    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Event: Important Meeting");
  });

  it("handles CRLF line endings", () => {
    const ics = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:crlf\r\nSUMMARY:CRLF Event\r\nDTSTART:20260101T100000Z\r\nEND:VEVENT\r\nEND:VCALENDAR";
    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("CRLF Event");
  });

  it("handles multiple events in one calendar", () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:multi-1
SUMMARY:First
DTSTART:20260102T100000Z
END:VEVENT
BEGIN:VEVENT
UID:multi-2
SUMMARY:Second
DTSTART:20260101T100000Z
END:VEVENT
END:VCALENDAR`;
    const events = parseIcs(ics);
    expect(events).toHaveLength(2);
    // Should be sorted by date
    expect(events[0].title).toBe("Second");
    expect(events[1].title).toBe("First");
  });

  it("ignores non-VEVENT components", () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VTODO
UID:todo-1
SUMMARY:Not an event
DTSTART:20260101T100000Z
END:VTODO
BEGIN:VEVENT
UID:real-event
SUMMARY:Real Event
DTSTART:20260101T100000Z
END:VEVENT
END:VCALENDAR`;
    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Real Event");
  });

  it("strips double quotes from parameter values", () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:quoted-param
SUMMARY:Quoted Param
DTSTART;TZID="America/New_York":20260615T140000
END:VEVENT
END:VCALENDAR`;
    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
  });
});
