/** Covers malformed and adversarial ICS input handling. */

import { describe, expect, it } from "vitest";
import { parseIcs } from "../icsParser";
import { icsCalendar, icsCalendarEvents } from "./icsFixtures";

describe("parseIcs: adversarial edge cases", () => {
  it.each(["", "this is not an ics file at all\nrandom\nlines", "\x00\x01\x02\xFF\xFE"])("returns empty array for malformed input", (input) => {
    expect(parseIcs(input)).toEqual([]);
  });

  it.each([
    ["missing SUMMARY", "UID:no-summary\nDTSTART:20260101T100000Z"],
    ["missing DTSTART", "UID:no-dtstart\nSUMMARY:Missing Start"],
    ["invalid DTSTART", "UID:bad-date\nSUMMARY:Bad Date\nDTSTART:not-a-date"]
  ])("skips events with %s", (_description, body) => {
    expect(parseIcs(icsCalendar(body))).toEqual([]);
  });

  it.each([
    ["TZID parameter", "UID:tzid-test\nSUMMARY:Berlin Event\nDTSTART;TZID=Europe/Berlin:20260615T140000", "startsAt", "2026-06-15T12:00:00.000Z"],
    ["numeric offset", "UID:offset-test\nSUMMARY:Offset Event\nDTSTART:20260615T140000+0200", "startsAt", "2026-06-15T12:00:00.000Z"],
    ["VALUE=DATE", "UID:value-date\nSUMMARY:Date Only\nDTSTART;VALUE=DATE:20260615", "startsAt", "2026-06-15T00:00:00.000Z"],
    ["epoch-zero timestamp", "UID:epoch-zero\nSUMMARY:Unix Epoch\nDTSTART:19700101T000000Z", "startsAt", "1970-01-01T00:00:00.000Z"],
    ["colons in values", "UID:colon-value\nSUMMARY:Event: Important Meeting\nDTSTART:20260101T100000Z", "title", "Event: Important Meeting"]
  ])("handles DTSTART with %s", (_description, body, field, expected) => {
    expect(parseIcs(icsCalendar(body))[0][field as "startsAt" | "title"]).toBe(expected);
  });

  it.each([
    ["colon-rich description", `UID:colon-rich\nSUMMARY:Colon rich\nDTSTART:20260101T100000Z\nDESCRIPTION:Before${":".repeat(256 * 1024)}After`],
    ["folded logical line", `UID:folded-overflow\nSUMMARY:Folded overflow\nDTSTART:20260101T100000Z\nDESCRIPTION:${"a".repeat(40_000)}\n ${"b".repeat(40_000)}`],
    ["oversized RRULE", `UID:oversized-rule\nSUMMARY:Rule bounded\nDTSTART:20260101T100000Z\nRRULE:${"FREQ=DAILY;".repeat(2_000)}`]
  ])("drops %s exceeding a scanner budget", (_description, body) => {
    const startedAt = performance.now();
    expect(parseIcs(icsCalendar(body))).toEqual([]);
    expect(performance.now() - startedAt).toBeLessThan(1000);
  });

  it("drops a property whose parameter count exceeds the bound", () => {
    const fillerParameters = Array.from({ length: 1_000 }, () => "X=a=b").join(";");
    const startedAt = performance.now();
    expect(parseIcs(icsCalendar(`UID:many-parameters\nSUMMARY:Parameter bounded\nDTSTART;TZID=Europe/Berlin;${fillerParameters}:20260615T140000`))).toEqual([]);
    expect(performance.now() - startedAt).toBeLessThan(1000);
  });

  it("does not silently ignore a TZID beyond the parameter bound", () => {
    const fillerParameters = Array.from({ length: 64 }, () => "X=a").join(";");
    expect(parseIcs(icsCalendar(`UID:late-tzid\nSUMMARY:Late TZID\nDTSTART;${fillerParameters};TZID=Europe/Berlin:20260615T140000`))).toEqual([]);
  });

  it("skips unknown properties before allocating retained event state", () => {
    const unknownProperties = Array.from({ length: 5_000 }, (_unused, index) => `X-UNKNOWN-${index}:a`).join("\n");
    const startedAt = performance.now();
    expect(parseIcs(icsCalendar(`UID:known-only\nSUMMARY:Known\nDTSTART:20260101T100000Z\n${unknownProperties}`)).map((event) => event.id)).toEqual(["known-only"]);
    expect(performance.now() - startedAt).toBeLessThan(1000);
  });

  it("drops a VEVENT with too many EXDATE properties rather than restoring excluded instances", () => {
    const exdates = Array.from({ length: 513 }, () => "EXDATE:20260101T100000Z").join("\n");
    expect(parseIcs(icsCalendar(`UID:too-many-exdates\nSUMMARY:Cancelled series\nDTSTART:20260101T100000Z\nRRULE:FREQ=DAILY;COUNT=2\n${exdates}`), { referenceDate: new Date("2025-01-01T00:00:00.000Z") })).toEqual([]);
  });

  it("handles CRLF line endings", () => {
    expect(parseIcs(icsCalendar("UID:crlf\nSUMMARY:CRLF Event\nDTSTART:20260101T100000Z").replace(/\n/g, "\r\n"))[0].title).toBe("CRLF Event");
  });

  it("handles multiple events in one calendar", () => {
    expect(parseIcs(icsCalendarEvents(["UID:multi-1\nSUMMARY:First\nDTSTART:20260102T100000Z", "UID:multi-2\nSUMMARY:Second\nDTSTART:20260101T100000Z"])).map((event) => event.title)).toEqual(["Second", "First"]);
  });

  it("ignores non-VEVENT components", () => {
    const ics = `BEGIN:VCALENDAR\nBEGIN:VTODO\nUID:todo-1\nSUMMARY:Not an event\nDTSTART:20260101T100000Z\nEND:VTODO\n${icsCalendar("UID:real-event\nSUMMARY:Real Event\nDTSTART:20260101T100000Z").replace("BEGIN:VCALENDAR\n", "").replace("\nEND:VCALENDAR", "")}\nEND:VCALENDAR`;
    expect(parseIcs(ics)[0].title).toBe("Real Event");
  });

  it("strips double quotes from parameter values", () => {
    expect(parseIcs(icsCalendar('UID:quoted-param\nSUMMARY:Quoted Param\nDTSTART;TZID="America/New_York":20260615T140000'))).toHaveLength(1);
  });

  it("caps output by relevance rather than source order", () => {
    const bodies = ["UID:one\nSUMMARY:One\nDTSTART:20260101T100000Z", "UID:two\nSUMMARY:Two\nDTSTART:20260102T100000Z", "UID:three\nSUMMARY:Three\nDTSTART:20260103T100000Z"];
    const options = { maxTotalEvents: 2, referenceDate: new Date("2026-01-01T12:00:00.000Z") };
    expect(parseIcs(icsCalendarEvents(bodies), options).map((event) => event.id)).toEqual(["two", "three"]);
    expect(parseIcs(icsCalendarEvents([...bodies].reverse()), options).map((event) => event.id)).toEqual(["two", "three"]);
  });

  it("bounds high-frequency rules to the requested window and instance cap", () => {
    const oneSecondAgo = new Date(Date.now() - 1000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    expect(parseIcs(icsCalendar(`UID:secondly\nSUMMARY:Frequent event\nDTSTART:${oneSecondAgo}\nRRULE:FREQ=SECONDLY`), { rruleHorizonDays: 90, rruleMaxInstances: 25 })).toHaveLength(25);
  });

  it.each([
    ["a far-past million-occurrence rule", "FREQ=SECONDLY;COUNT=1000000"],
    ["a far-past open-ended rule", "FREQ=MINUTELY"],
    ["a combinatorial BY-rule", "FREQ=YEARLY;COUNT=3;BYMONTH=1,2,3,4,5,6,7,8,9,10,11,12;BYMONTHDAY=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28;BYHOUR=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23"]
  ])("bounds recurrence work for %s", (_description, rule) => {
    const startedAt = performance.now();
    const events = parseIcs(icsCalendar(`UID:expensive-recurrence\nSUMMARY:Unsupported expensive recurrence\nDTSTART:20200101T000000Z\nRRULE:${rule}`), { referenceDate: new Date("2022-01-01T00:00:00.000Z"), rruleMaxInstances: 3 });
    expect(performance.now() - startedAt).toBeLessThan(250);
    expect(events).toMatchObject([{ id: "expensive-recurrence", title: "Unsupported expensive recurrence", startsAt: "2020-01-01T00:00:00.000Z" }]);
  });

  it("still expands a long-running open daily rule within the work budget", () => {
    const events = parseIcs(icsCalendar("UID:long-running-daily\nSUMMARY:Daily office hour\nDTSTART:20100101T000000Z\nRRULE:FREQ=DAILY"), { referenceDate: new Date("2026-07-14T00:00:00.000Z"), rruleMaxInstances: 3 });
    expect(events.map((event) => event.startsAt)).toEqual(["2026-07-14T00:00:00.000Z", "2026-07-15T00:00:00.000Z", "2026-07-16T00:00:00.000Z"]);
    expect(events.every((event) => event.isRecurring)).toBe(true);
  });

  it("does not let an out-of-horizon rule displace an eligible recurrence", () => {
    const eligible = "UID:old-soon\nSUMMARY:Eligible annual event\nDTSTART:20000715T100000Z\nRRULE:FREQ=YEARLY";
    const outOfHorizon = "UID:newer-far\nSUMMARY:Out-of-horizon annual event\nDTSTART:20251231T100000Z\nRRULE:FREQ=YEARLY";
    const options = { referenceDate: new Date("2026-07-14T00:00:00.000Z"), rruleHorizonDays: 90, maxTotalEvents: 1 };
    for (const bodies of [[eligible, outOfHorizon], [outOfHorizon, eligible]]) {
      expect(parseIcs(icsCalendarEvents(bodies), options)).toMatchObject([{ startsAt: "2026-07-15T10:00:00.000Z", isRecurring: true }]);
    }
  });

  it("keeps preparation bounded when a feed contains many non-recurring VEVENTs", () => {
    const bodies = Array.from({ length: 20_000 }, (_unused, index) => `UID:event-${index}\nSUMMARY:Event ${index}\nDTSTART:20260101T000000Z`);
    const startedAt = performance.now();
    const events = parseIcs(icsCalendarEvents(bodies), { maxTotalEvents: 1, referenceDate: new Date("2025-01-01T00:00:00.000Z") });
    expect(performance.now() - startedAt).toBeLessThan(1000);
    expect(events).toMatchObject([{ id: "event-0" }]);
  });
});
