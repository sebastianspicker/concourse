/** Exercises schedule-hook behavior for empty, canceled, and failed resource responses. */
import { describe, expect } from "vitest";
import { defineResourceEdgeCases } from "./resourceTestCases";
import { useSchedule } from "../useSchedule";

describe("useSchedule: edge cases", () => {
  defineResourceEdgeCases({
    assertEmpty: (data) => expect(data?.schedule).toEqual([]),
    emptyBody: { schedule: [] },
    emptyTestName: "returns empty schedule array without crashing on empty response",
    errorTestName: "handles non-retryable error response",
    hook: useSchedule
  });
});
