/** Verifies recurring ICS events preserve local times across daylight-saving changes. */

import { describe, expect, it } from "vitest";
import { parseIcs } from "../icsParser";
import { icsCalendar } from "./icsFixtures";

const referenceDate = new Date("2026-03-26T00:00:00.000Z");

function parseBerlinSeries(body: string, date = referenceDate) {
  return parseIcs(icsCalendar(body), { referenceDate: date });
}

describe("ICS recurrence timezone handling", () => {
  it("preserves a Berlin wall time and duration across spring daylight saving", () => {
    const events = parseBerlinSeries([
      "UID:berlin-spring-series",
      "SUMMARY:Berlin Afternoon Class",
      "DTSTART;TZID=Europe/Berlin:20260327T140000",
      "DTEND;TZID=Europe/Berlin:20260327T150000",
      "RRULE:FREQ=DAILY;COUNT=5"
    ].join("\n"));
    expect(events.map((event) => event.startsAt)).toEqual([
      "2026-03-27T13:00:00.000Z", "2026-03-28T13:00:00.000Z", "2026-03-29T12:00:00.000Z",
      "2026-03-30T12:00:00.000Z", "2026-03-31T12:00:00.000Z"
    ]);
    expect(events.map((event) => event.endsAt)).toContain("2026-03-29T13:00:00.000Z");
  });

  it("preserves a Berlin wall time across autumn daylight saving", () => {
    const events = parseBerlinSeries("UID:berlin-autumn\nSUMMARY:Class\nDTSTART;TZID=Europe/Berlin:20261023T140000\nRRULE:FREQ=DAILY;COUNT=5", new Date("2026-10-22T00:00:00.000Z"));
    expect(events.map((event) => event.startsAt)).toEqual([
      "2026-10-23T12:00:00.000Z", "2026-10-24T12:00:00.000Z", "2026-10-25T13:00:00.000Z",
      "2026-10-26T13:00:00.000Z", "2026-10-27T13:00:00.000Z"
    ]);
  });

  it("applies EXDATE and UTC UNTIL rules after daylight-saving", () => {
    const cases = [
      { body: "UID:berlin-exdate\nSUMMARY:Class\nDTSTART;TZID=Europe/Berlin:20260327T140000\nRRULE:FREQ=DAILY;COUNT=5\nEXDATE;TZID=Europe/Berlin:20260329T140000", excludedStart: "2026-03-29T12:00:00.000Z" },
      { body: "UID:berlin-exdate\nSUMMARY:Class\nDTSTART;TZID=Europe/Berlin:20260327T140000\nRRULE:FREQ=DAILY;COUNT=5\nEXDATE:20260329T120000Z", excludedStart: "2026-03-29T12:00:00.000Z" },
      { body: "UID:berlin-until\nSUMMARY:Class\nDTSTART;TZID=Europe/Berlin:20260327T140000\nRRULE:FREQ=DAILY;UNTIL=20260329T120000Z", expectedCount: 3 },
      { body: "UID:berlin-until\nSUMMARY:Class\nDTSTART;TZID=Europe/Berlin:20260327T140000\nRRULE:FREQ=DAILY;UNTIL=20260329T115959Z", expectedCount: 2 }
    ];

    for (const testCase of cases) {
      const events = parseBerlinSeries(testCase.body);
      if ("excludedStart" in testCase) {
        expect(events.map((event) => event.startsAt)).not.toContain(testCase.excludedStart);
      } else {
        expect(events).toHaveLength(testCase.expectedCount);
      }
    }
  });

  it("normalizes case-insensitive property and parameter names without changing values", () => {
    const events = parseBerlinSeries("uid:mixed-case\nsUmMaRy:Class\ndTsTaRt;tZiD=Europe/Berlin:20260327T140000\nrRuLe:FREQ=DAILY;COUNT=3\neXdAtE;tZiD=Europe/Berlin:20260328T140000");
    expect(events.map((event) => event.startsAt)).toEqual(["2026-03-27T13:00:00.000Z", "2026-03-29T12:00:00.000Z"]);
  });

  it.each(["20260230", "20260230T100000Z", "20261301T100000+0100"])("skips invalid calendar components: %s", (value) => {
    expect(parseIcs(icsCalendar(`UID:invalid\nSUMMARY:Invalid\nDTSTART:${value}`))).toEqual([]);
  });

  it("accepts a valid leap day", () => {
    expect(parseIcs(icsCalendar("UID:leap\nSUMMARY:Leap\nDTSTART:20260228T100000Z"))).toHaveLength(1);
    expect(parseIcs(icsCalendar("UID:leap\nSUMMARY:Leap\nDTSTART:20240229T100000Z"))).toHaveLength(1);
  });
});
