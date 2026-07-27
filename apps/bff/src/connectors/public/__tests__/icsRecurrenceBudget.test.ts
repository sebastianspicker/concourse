/** Verifies recurrence expansion work and output-budget enforcement. */

import { describe, expect, it } from "vitest";
import { parseIcs } from "../icsParser";
import { icsCalendar, icsCalendarEvents } from "./icsFixtures";

describe("ICS recurrence budgets", () => {
  it("uses the retained output cap when preflighting recurrence work", () => {
    const ics = icsCalendar("UID:boundary-daily\nSUMMARY:Boundary daily event\nDTSTART:19990417T000000Z\nRRULE:FREQ=DAILY");

    expect(parseIcs(ics, {
      referenceDate: new Date("2026-07-14T00:00:00.000Z"),
      maxTotalEvents: 1
    })).toMatchObject([{
      startsAt: "2026-07-14T00:00:00.000Z",
      isRecurring: true
    }]);
  });

  it("falls back promptly for a long-running hourly rule beyond the work budget", () => {
    const ics = icsCalendar("UID:long-running-hourly\nSUMMARY:Unsupported hourly series\nDTSTART:20100101T000000Z\nRRULE:FREQ=HOURLY");
    const startedAt = performance.now();
    const events = parseIcs(ics, {
      referenceDate: new Date("2026-07-14T00:00:00.000Z"),
      rruleMaxInstances: 3
    });

    expect(performance.now() - startedAt).toBeLessThan(250);
    expect(events).toHaveLength(1);
    expect(events[0].isRecurring).toBeUndefined();
  });

  it("allocates the document recurrence budget independently of VEVENT source order", () => {
    /** Produces one valid recurring VEVENT identified by the supplied fixture ID. */
    const event = (id: string) => `UID:${id}\nSUMMARY:Daily office hour ${id}\nDTSTART:20050101T000000Z\nRRULE:FREQ=DAILY`;
    const ids = ["a", "b", "c", "d", "e", "f", "g"];
    /** Places fixture event IDs in caller order to test order-independent budgeting. */
    const options = {
      referenceDate: new Date("2026-07-14T00:00:00.000Z"),
      rruleMaxInstances: 1
    };

    const forward = parseIcs(icsCalendarEvents(ids.map(event)), options);
    const reversed = parseIcs(icsCalendarEvents([...ids].reverse().map(event)), options);

    expect(reversed).toEqual(forward);
    expect(forward.every((entry) => entry.isRecurring === undefined)).toBe(true);
  });

  it("does not let structurally invalid RRULE VEVENTs poison recurrence shares", () => {
    const good = "UID:good-daily\nSUMMARY:Good daily\nDTSTART:20100101T000000Z\nRRULE:FREQ=DAILY";
    /** Produces a structurally invalid recurrence fixture that must not consume a share. */
    const invalid = (index: number) => `UID:invalid-${index}\nRRULE:FREQ=DAILY`;
    const invalidEvents = Array.from({ length: 10 }, (_unused, index) => invalid(index));
    /** Wraps valid and invalid VEVENT fixtures in a single calendar document. */
    const options = {
      referenceDate: new Date("2026-07-14T00:00:00.000Z"),
      rruleMaxInstances: 1,
      maxTotalEvents: 1
    };

    for (const events of [[good, ...invalidEvents], [...invalidEvents, good]]) {
      expect(parseIcs(icsCalendarEvents(events), options)).toMatchObject([{
        id: expect.any(String),
        startsAt: "2026-07-14T00:00:00.000Z",
        isRecurring: true
      }]);
    }
  });

  it.each([
    ["a malformed rule", "NOT_A_RULE"],
    ["an excessive high-frequency rule", "FREQ=SECONDLY;COUNT=1000000"],
    [
      "a combinatorial BY-rule",
      "FREQ=YEARLY;COUNT=3;BYMONTH=1,2,3,4,5,6,7,8,9,10,11,12;BYMONTHDAY=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28;BYHOUR=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23"
    ]
  ])("does not let %s dilute valid recurrence work", (_description, poisonRule) => {
    const valid = "UID:valid-daily\nSUMMARY:Valid daily\nDTSTART:20100101T000000Z\nRRULE:FREQ=DAILY";
    /** Produces a valid-looking but preflight-rejected recurrence fixture. */
    const poison = (index: number) => `UID:poison-${index}\nSUMMARY:Poison ${index}\nDTSTART:20000101T000000Z\nRRULE:${poisonRule}`;
    const poisonEvents = Array.from({ length: 10 }, (_unused, index) => poison(index));
    /** Wraps poison and valid event fixtures for recurrence-budget assertions. */
    const options = {
      referenceDate: new Date("2026-07-14T00:00:00.000Z"),
      rruleMaxInstances: 1,
      maxTotalEvents: 1
    };

    for (const events of [[valid, ...poisonEvents], [...poisonEvents, valid]]) {
      expect(parseIcs(icsCalendarEvents(events), options)).toMatchObject([{
        startsAt: "2026-07-14T00:00:00.000Z",
        isRecurring: true
      }]);
    }
  });
});
