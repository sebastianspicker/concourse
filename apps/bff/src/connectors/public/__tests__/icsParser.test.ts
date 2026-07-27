/** Verifies standard ICS event parsing and recurrence behavior. */

import { describe, expect, it } from "vitest";
import { parseIcs } from "../icsParser";
import { icsCalendar, icsCalendarEvents } from "./icsFixtures";

const recurringOptions = { rruleHorizonDays: 30 };

describe("parseIcs", () => {
  describe("basic parsing", () => {
    it("parses a simple event", () => {
      const events = parseIcs(icsCalendar("UID:test-1\nSUMMARY:Test Event\nDTSTART:20260101T100000Z\nDTEND:20260101T110000Z\nLOCATION:Room 101"));

      expect(events).toEqual([{
        id: "test-1", title: "Test Event", startsAt: "2026-01-01T10:00:00.000Z",
        endsAt: "2026-01-01T11:00:00.000Z", location: "Room 101", campusId: undefined
      }]);
    });

    it.each([
      ["all-day event", "UID:test-2\nSUMMARY:All Day Event\nDTSTART:20260101", "startsAt", "2026-01-01T00:00:00.000Z"],
      ["unescaped summary", "UID:test-3\nSUMMARY:Event with\\, comma and\\n newline\nLOCATION:Room \\; 101\nDTSTART:20260101T100000Z", "title", "Event with, comma and\n newline"],
      ["campus ID", "UID:campus-test-1\nSUMMARY:Event with Campus\nDTSTART:20260101T100000Z\nX-CAMPUS-ID:main-campus", "campusId", "main-campus"],
      ["alternate campus ID", "UID:campus-test-2\nSUMMARY:Event with Campus\nDTSTART:20260101T100000Z\nX-CAMPUS:secondary-campus", "campusId", "secondary-campus"]
    ])("parses %s", (_description, body, field, expected) => {
      expect(parseIcs(icsCalendar(body))[0][field as "startsAt" | "title" | "campusId"]).toBe(expected);
    });

    it("handles missing UID by generating stable ID", () => {
      const events = parseIcs(icsCalendar("SUMMARY:No UID Event\nDTSTART:20260101T100000Z"));
      expect(events).toHaveLength(1);
      expect(events[0].id).toMatch(/^[a-f0-9]{16}$/);
    });

    it("unescapes special characters in location", () => {
      expect(parseIcs(icsCalendar("UID:test-3\nSUMMARY:Event\nLOCATION:Room \\; 101\nDTSTART:20260101T100000Z"))[0].location).toBe("Room ; 101");
    });
  });

  describe("RRULE expansion", () => {
    it("expands daily recurring event", () => {
      const events = parseIcs(icsCalendar("UID:daily-recurring\nSUMMARY:Daily Standup\nDTSTART:20260201T090000Z\nDTEND:20260201T093000Z\nRRULE:FREQ=DAILY;COUNT=3"), recurringOptions);
      expect(events.map((event) => event.startsAt)).toEqual(["2026-02-01T09:00:00.000Z", "2026-02-02T09:00:00.000Z", "2026-02-03T09:00:00.000Z"]);
      expect(events.every((event) => event.isRecurring)).toBe(true);
    });

    it.each([
      ["weekly BYDAY", "UID:weekly-recurring\nSUMMARY:Weekly Meeting\nDTSTART:20260202T140000Z\nDTEND:20260202T150000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=3", 30, [1, 3, 5], "day"],
      ["monthly", "UID:monthly-recurring\nSUMMARY:Monthly Review\nDTSTART:20260115T100000Z\nDTEND:20260115T110000Z\nRRULE:FREQ=MONTHLY;COUNT=3", 90, [0, 1, 2], "month"]
    ])("expands %s recurrence", (_description, body, horizon, expected, unit) => {
      const events = parseIcs(icsCalendar(body), { rruleHorizonDays: horizon });
      const values = events.map((event) => unit === "day" ? new Date(event.startsAt).getUTCDay() : new Date(event.startsAt).getUTCMonth());
      expect(values).toEqual(expected);
    });

    it.each([
      ["UNTIL", "UID:until-recurring\nSUMMARY:Limited Series\nDTSTART:20260201T100000Z\nDTEND:20260201T110000Z\nRRULE:FREQ=DAILY;UNTIL=20260205T100000Z", { rruleHorizonDays: 30 }, 5],
      ["horizon", "UID:horizon-test\nSUMMARY:Daily Forever\nDTSTART:20260201T100000Z\nRRULE:FREQ=DAILY", { rruleHorizonDays: 7 }, 8],
      ["instance cap", "UID:max-instances-test\nSUMMARY:Daily Forever\nDTSTART:20260201T100000Z\nRRULE:FREQ=DAILY", { rruleHorizonDays: 365, rruleMaxInstances: 5 }, 5]
    ])("limits expansion by %s", (_description, body, options, maximum) => {
      expect(parseIcs(icsCalendar(body), options).length).toBeLessThanOrEqual(maximum);
    });

    it("respects INTERVAL parameter", () => {
      const events = parseIcs(icsCalendar("UID:interval-recurring\nSUMMARY:Bi-weekly Meeting\nDTSTART:20260203T100000Z\nDTEND:20260203T110000Z\nRRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=3"), { rruleHorizonDays: 60 });
      expect(events.slice(1).map((event, index) => new Date(event.startsAt).getTime() - new Date(events[index].startsAt).getTime())).toEqual([1_209_600_000, 1_209_600_000]);
    });

    it("preserves duration across instances", () => {
      const events = parseIcs(icsCalendar("UID:duration-test\nSUMMARY:2-Hour Meeting\nDTSTART:20260201T100000Z\nDTEND:20260201T120000Z\nRRULE:FREQ=DAILY;COUNT=3"), recurringOptions);
      expect(events.map((event) => new Date(event.endsAt!).getTime() - new Date(event.startsAt).getTime())).toEqual([7_200_000, 7_200_000, 7_200_000]);
    });

    it("generates unique IDs for each instance", () => {
      const events = parseIcs(icsCalendar("UID:unique-id-test\nSUMMARY:Recurring Event\nDTSTART:20260201T100000Z\nRRULE:FREQ=DAILY;COUNT=3"), recurringOptions);
      expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
    });

    it("handles invalid RRULE gracefully by returning base event", () => {
      expect(parseIcs(icsCalendar("UID:invalid-rrule\nSUMMARY:Bad RRULE\nDTSTART:20260201T100000Z\nRRULE:INVALID_RULE"), recurringOptions)).toMatchObject([{ title: "Bad RRULE" }]);
    });

    it.each([
      ["plain EXDATE", "UID:excluded-only-occurrence\nSUMMARY:Cancelled Meeting\nDTSTART:20260201T100000Z\nRRULE:FREQ=DAILY;COUNT=1\nEXDATE:20260201T100000Z"],
      ["timezone-qualified EXDATE", "UID:excluded-timezone-occurrence\nSUMMARY:Cancelled Berlin Meeting\nDTSTART;TZID=Europe/Berlin:20260201T100000\nRRULE:FREQ=DAILY;COUNT=1\nEXDATE;TZID=Europe/Berlin:20260201T100000"]
    ])("does not restore an occurrence removed by %s", (_description, body) => {
      expect(parseIcs(icsCalendar(body), { referenceDate: new Date("2026-01-01T00:00:00.000Z") })).toEqual([]);
    });

    it("handles non-recurring event without RRULE", () => {
      expect(parseIcs(icsCalendar("UID:non-recurring\nSUMMARY:One-time Event\nDTSTART:20260201T100000Z"), recurringOptions)[0].isRecurring).toBeUndefined();
    });
  });

  describe("line unfolding and sorting", () => {
    it("handles folded lines", () => {
      expect(parseIcs(icsCalendar("UID:folded-test\nSUMMARY:This is a very long title that\n  continues on the next line\nDTSTART:20260101T100000Z"))[0].title).toBe("This is a very long title that continues on the next line");
    });

    it("detects a recurrence rule whose property name is folded", () => {
      expect(parseIcs(icsCalendar("UID:folded-rule\nSUMMARY:Folded recurrence\nDTSTART:20260101T100000Z\nRRU\n LE:FREQ=DAILY;COUNT=2"), { referenceDate: new Date("2025-12-31T00:00:00.000Z") })).toHaveLength(2);
    });

    it("sorts events by start date", () => {
      const bodies = ["UID:event-3\nSUMMARY:Event 3\nDTSTART:20260103T100000Z", "UID:event-1\nSUMMARY:Event 1\nDTSTART:20260101T100000Z", "UID:event-2\nSUMMARY:Event 2\nDTSTART:20260102T100000Z"];
      expect(parseIcs(icsCalendarEvents(bodies)).map((event) => event.title)).toEqual(["Event 1", "Event 2", "Event 3"]);
    });
  });

  describe("description field", () => {
    it.each([
      ["parses DESCRIPTION", "UID:desc-test-1\nSUMMARY:Event with Description\nDTSTART:20260101T100000Z\nDESCRIPTION:This is a test description with some details.", "This is a test description with some details."],
      ["leaves DESCRIPTION absent", "UID:desc-test-2\nSUMMARY:Event without Description\nDTSTART:20260101T100000Z", undefined],
      ["unescapes DESCRIPTION", "UID:desc-test-3\nSUMMARY:Escape Test\nDTSTART:20260101T100000Z\nDESCRIPTION:Line 1\\nLine 2\\, with comma", "Line 1\nLine 2, with comma"]
    ])("%s", (_description, body, expected) => {
      expect(parseIcs(icsCalendar(body))[0].description).toBe(expected);
    });
  });

  describe("recurringInstanceId stability", () => {
    const stableSeries = "UID:stable-id-test\nSUMMARY:Recurring Stable\nDTSTART:20260201T090000Z\nDTEND:20260201T093000Z\nRRULE:FREQ=DAILY;COUNT=3";

    it("produces identical recurringInstanceIds when parsed twice", () => {
      expect(parseIcs(icsCalendar(stableSeries), recurringOptions).map((event) => event.recurringInstanceId)).toEqual(parseIcs(icsCalendar(stableSeries), recurringOptions).map((event) => event.recurringInstanceId));
    });

    it("produces different recurringInstanceIds for different start times", () => {
      const events = parseIcs(icsCalendar(stableSeries.replace("stable-id", "distinct-id")), recurringOptions);
      expect(new Set(events.map((event) => event.recurringInstanceId)).size).toBe(events.length);
    });
  });
});
