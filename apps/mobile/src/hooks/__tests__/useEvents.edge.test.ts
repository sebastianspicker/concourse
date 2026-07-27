/** Exercises event-hook edge cases such as canceled requests and empty filters. */
import { describe, expect } from "vitest";
import { defineResourceEdgeCases } from "./resourceTestCases";
import { useEvents } from "../useEvents";

describe("useEvents: edge cases", () => {
  defineResourceEdgeCases({
    assertEmpty: (data) => expect(data?.events).toEqual([]),
    emptyBody: { events: [] },
    emptyTestName: "returns empty events array without crashing on empty response",
    errorTestName: "handles fetch returning non-ok response",
    hook: useEvents
  });
});
