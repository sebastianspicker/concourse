/** Exercises VEVENT stream lifecycle transitions through its public callback API. */

import { describe, expect, it } from "vitest";
import { forEachValidIcsEvent, type EventAccumulator } from "../icsEventStream";

const collectEvents = (ics: string): EventAccumulator[] => {
  const events: EventAccumulator[] = [];
  forEachValidIcsEvent(ics, (event) => events.push(event));
  return events;
};

const event = (properties: string): string => `BEGIN:VEVENT\n${properties}\nEND:VEVENT`;

describe("forEachValidIcsEvent", () => {
  it("ignores oversized lines outside an active VEVENT", () => {
    const oversized = `X:${"x".repeat(64 * 1024)}`;
    const events = collectEvents(`${oversized}\n${event("UID:kept\nSUMMARY:Kept\nDTSTART:20260101T100000Z")}`);

    expect(events).toHaveLength(1);
    expect(events[0].current.UID?.value).toBe("kept");
  });

  it("invalidates only the active VEVENT for an oversized line", () => {
    const oversized = `DESCRIPTION:${"x".repeat(64 * 1024)}`;
    const ics = `${event(`UID:dropped\nSUMMARY:Dropped\n${oversized}\nDTSTART:20260101T100000Z`)}\n${event("UID:kept\nSUMMARY:Kept\nDTSTART:20260102T100000Z")}`;

    expect(collectEvents(ics).map((entry) => entry.current.UID?.value)).toEqual(["kept"]);
  });

  it("replaces an unterminated VEVENT when a new VEVENT begins", () => {
    const ics = "BEGIN:VEVENT\nUID:discarded\nLOCATION:discarded-place\nEXDATE:20260101T100000Z\nBEGIN:VEVENT\nUID:kept\nSUMMARY:Kept\nDTSTART:20260102T100000Z\nEND:VEVENT";
    const events = collectEvents(ics);

    expect(events.map((entry) => entry.current.UID?.value)).toEqual(["kept"]);
    expect(events[0].current.LOCATION).toBeUndefined();
    expect(events[0].exdates).toEqual([]);
    expect(events[0].propertyCount).toBe(3);
  });

  it("emits only active valid VEVENTs and clears state at END", () => {
    const ics = `END:VEVENT\n${event("UID:kept\nSUMMARY:Kept\nDTSTART:20260102T100000Z")}\nSUMMARY:outside\nEND:VEVENT`;

    expect(collectEvents(ics)).toHaveLength(1);
    expect(collectEvents(ics)[0].current.SUMMARY?.value).toBe("Kept");
  });

  it("ignores non-VEVENT components and ordinary lines outside VEVENTs", () => {
    const ics = `BEGIN:VCALENDAR\nBEGIN:VTODO\nUID:todo\nSUMMARY:Ignore me\nEND:VTODO\n${event("UID:kept\nSUMMARY:Kept\nDTSTART:20260102T100000Z")}\nEND:VCALENDAR`;

    expect(collectEvents(ics).map((entry) => entry.current.UID?.value)).toEqual(["kept"]);
  });

  it("calls the callback with the active event and preserves a thrown error", () => {
    const failure = new Error("stop streaming");
    let received: EventAccumulator | undefined;
    let thrown: unknown;

    try {
      forEachValidIcsEvent(event("UID:callback\nSUMMARY:Callback\nDTSTART:20260102T100000Z"), (entry) => {
        received = entry;
        throw failure;
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBe(failure);
    expect(received?.current.UID?.value).toBe("callback");
  });

  it.each(["\n", "\r\n"])("preserves folded properties with %j line endings", (lineEnding) => {
    const ics = ["BEGIN:VEVENT", "UID:folded", "SUMMARY:Folded", " title", "DTSTART:20260102T100000Z", "END:VEVENT"].join(lineEnding);

    expect(collectEvents(ics)[0].current.SUMMARY?.value).toBe("Foldedtitle");
  });
});
