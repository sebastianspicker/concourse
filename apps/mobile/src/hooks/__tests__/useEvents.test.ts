/** Verifies event queries refresh through the shared offline-aware resource hook. */
import { describe, expect } from "vitest";
import { defineResourceSuccessCase } from "./resourceTestCases";
import { useEvents } from "../useEvents";

const mockEvents = {
  events: [
    {
      id: "event-1",
      title: "Public Event",
      date: "2020-01-01T00:00:00.000Z",
      sourceUrl: "https://example.org/events"
    }
  ]
};

describe("useEvents", () => {
  defineResourceSuccessCase({
    assertLoaded: (data) => expect(data?.events.length).toBe(1),
    body: mockEvents,
    hook: useEvents,
    testName: "loads events",
  });
});
