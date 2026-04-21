import { describe, expect, it } from "vitest";
import {
  formatEventDate,
  formatScheduleTime,
  formatDateOnly,
  formatTimeRange,
  isToday,
} from "../dateFormat";

describe("formatEventDate", () => {
  it("formats a valid ISO date string", () => {
    const result = formatEventDate("2026-03-22T14:30:00.000Z", "en-US");
    expect(result).toContain("2026");
  });

  it("handles epoch date", () => {
    const result = formatEventDate("1970-01-01T00:00:00.000Z", "en-US");
    expect(result).toContain("1970");
  });
});

describe("formatScheduleTime", () => {
  it("formats time with 2-digit hours and minutes", () => {
    const result = formatScheduleTime("2026-03-22T09:05:00.000Z", "en-GB");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe("formatDateOnly", () => {
  it("formats date without time", () => {
    const result = formatDateOnly("2026-03-22T14:30:00.000Z", "en-GB");
    expect(result).toContain("2026");
    expect(result).not.toContain("14:30");
  });
});

describe("formatTimeRange", () => {
  it("formats range with start and end", () => {
    const result = formatTimeRange(
      "2026-03-22T14:30:00.000Z",
      "2026-03-22T16:00:00.000Z",
      "en-GB"
    );
    expect(result).toContain(" - ");
  });

  it("returns only start time when no end provided", () => {
    const result = formatTimeRange("2026-03-22T14:30:00.000Z", undefined, "en-GB");
    expect(result).not.toContain(" - ");
  });
});

describe("isToday", () => {
  it("returns true for today's date", () => {
    const now = new Date().toISOString();
    expect(isToday(now)).toBe(true);
  });

  it("returns false for yesterday", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(isToday(yesterday)).toBe(false);
  });
});
