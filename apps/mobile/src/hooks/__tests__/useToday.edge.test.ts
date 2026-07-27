/** Exercises Today behavior around missing schedule data and rollover timing edge cases. */
import { describe, expect } from "vitest";
import { defineResourceEdgeCases } from "./resourceTestCases";
import { useToday } from "../useToday";

describe("useToday: edge cases", () => {
  defineResourceEdgeCases({
    assertEmpty: (data) => {
      expect(data?.events).toEqual([]);
      expect(data?.rooms).toEqual([]);
    },
    emptyBody: { events: [], rooms: [] },
    emptyTestName: "returns empty events and rooms without crashing on empty response",
    errorTestName: "handles non-retryable error response",
    hook: useToday
  });
});
