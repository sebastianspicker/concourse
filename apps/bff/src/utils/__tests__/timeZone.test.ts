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
});
