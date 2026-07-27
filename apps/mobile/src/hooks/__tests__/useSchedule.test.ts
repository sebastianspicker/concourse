/** Verifies schedule loading forwards filters through the shared resource lifecycle. */
import { describe, expect } from "vitest";
import { defineResourceSuccessCase } from "./resourceTestCases";
import { useSchedule } from "../useSchedule";
import type { ScheduleResponse } from "../../api/types";

const mockSchedule: ScheduleResponse = {
  schedule: [
    {
      id: "schedule-1",
      title: "Jazz Ensemble",
      startsAt: "2020-01-01T10:00:00.000Z",
      endsAt: "2020-01-01T12:00:00.000Z",
      location: "A-101",
      campusId: "cologne"
    }
  ]
};

describe("useSchedule", () => {
  defineResourceSuccessCase({
    assertLoaded: (data) => expect(data?.schedule.length).toBe(1),
    body: mockSchedule,
    hook: useSchedule,
    testName: "loads schedule",
  });
});
