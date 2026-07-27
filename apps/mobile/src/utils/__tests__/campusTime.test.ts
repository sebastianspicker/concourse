/** Verifies campus-day bounds remain correct across time zones and DST transitions. */
import { describe, expect, it } from "vitest";
import { getCampusDate, getCampusDayRange, millisecondsUntilNextCampusDay } from "../campusTime";

describe("campus time", () => {
  it("uses the configured campus date instead of the device or UTC date", () => {
    expect(getCampusDate(new Date("2026-02-01T00:30:00.000Z"), "America/New_York")).toBe("2026-01-31");
  });

  it("returns a 23-hour campus day when daylight saving time starts", () => {
    expect(getCampusDayRange(new Date("2026-03-08T16:00:00.000Z"), "America/New_York")).toEqual({
      from: "2026-03-08T05:00:00.000Z",
      to: "2026-03-09T03:59:59.999Z",
    });
  });

  it("returns a 25-hour campus day when daylight saving time ends", () => {
    const now = new Date("2026-11-01T16:00:00.000Z");
    expect(getCampusDayRange(now, "America/New_York")).toEqual({
      from: "2026-11-01T04:00:00.000Z",
      to: "2026-11-02T04:59:59.999Z",
    });
    expect(millisecondsUntilNextCampusDay(now, "America/New_York")).toBe(13 * 60 * 60 * 1000);
  });

  it("preserves non-hour timezone offsets", () => {
    expect(getCampusDayRange(new Date("2026-01-15T12:00:00.000Z"), "Australia/Adelaide")).toEqual({
      from: "2026-01-14T13:30:00.000Z",
      to: "2026-01-15T13:29:59.999Z",
    });
  });

  it("uses the first valid instant when a DST transition skips local midnight", () => {
    expect(getCampusDayRange(new Date("2026-09-06T12:00:00.000Z"), "America/Santiago")).toEqual({
      from: "2026-09-06T04:00:00.000Z",
      to: "2026-09-07T02:59:59.999Z",
    });
    expect(millisecondsUntilNextCampusDay(new Date("2026-09-06T03:30:00.000Z"), "America/Santiago")).toBe(30 * 60 * 1000);
  });
});
