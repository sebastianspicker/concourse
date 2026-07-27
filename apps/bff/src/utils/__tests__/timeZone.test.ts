/** Verifies timezone-aware date conversion and validation. */

import { describe, expect, it } from "vitest";
import { getDateKeyInTimeZone, parseDateTimeInTimeZone } from "../timeZone";

describe("timeZone helpers", () => {
  it("formats a UTC instant as a Berlin local date", () => {
    expect(getDateKeyInTimeZone("2026-06-15T22:30:00.000Z", "Europe/Berlin")).toBe("2026-06-16");
  });

  it("converts Berlin local wall time to UTC", () => {
    expect(
      parseDateTimeInTimeZone(
        { year: 2026, month: 6, day: 15, hour: 14, minute: 0, second: 0 },
        "Europe/Berlin"
      )
    ).toBe("2026-06-15T12:00:00.000Z");
  });

  it("uses the first occurrence of an ambiguous local time", () => {
    expect(
      parseDateTimeInTimeZone(
        { year: 2026, month: 10, day: 25, hour: 2, minute: 30, second: 0 },
        "Europe/Berlin"
      )
    ).toBe("2026-10-25T00:30:00.000Z");
  });

  it("uses the pre-gap offset for a nonexistent local time", () => {
    expect(
      parseDateTimeInTimeZone(
        { year: 2026, month: 3, day: 29, hour: 2, minute: 30, second: 0 },
        "Europe/Berlin"
      )
    ).toBe("2026-03-29T01:30:00.000Z");
  });

  it("rejects invalid calendar components", () => {
    expect(() =>
      parseDateTimeInTimeZone(
        { year: 2026, month: 2, day: 30, hour: 14, minute: 0, second: 0 },
        "Europe/Berlin"
      )
    ).toThrow("Invalid calendar datetime");
  });
});
