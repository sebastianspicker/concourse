/** Verifies public schedule sources fail closed without leaking source credentials to logs. */

import type { InstitutionPack } from "@concourse/institutions";
import { afterEach, describe, expect, it, vi } from "vitest";

const { fetchTextWithTimeout, log } = vi.hoisted(() => ({
  fetchTextWithTimeout: vi.fn(),
  log: vi.fn()
}));

vi.mock("../../runtime/httpClient", () => ({ fetchTextWithTimeout }));
vi.mock("../../runtime/logger", () => ({ log }));

import { clearCache } from "../../runtime/cache";
import { fetchPublicSchedule } from "./publicSchedule";

afterEach(() => {
  clearCache();
  vi.clearAllMocks();
});

function institution(id: string, schedules: Array<{ label: string; url: string }>): InstitutionPack {
  return {
    id,
    name: "Example University",
    type: "university",
    campuses: [],
    publicSources: { schedules }
  };
}

const VALID_CALENDAR = "BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:public\nSUMMARY:Open lecture\nDTSTART:20260101T100000Z\nEND:VEVENT\nEND:VCALENDAR";

describe("fetchPublicSchedule", () => {
  it("rejects a schedule source that bypassed pack validation without fetching or logging it", async () => {
    await expect(fetchPublicSchedule(institution("unsafe-schedule", [{
      label: "Campus calendar",
      url: "https://reader:secret@example.org/calendar.ics"
    }]))).rejects.toThrow("All public schedule sources failed");

    expect(fetchTextWithTimeout).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it("logs a stable label for a failed schedule source in a degraded partial result", async () => {
    fetchTextWithTimeout
      .mockResolvedValueOnce(VALID_CALENDAR)
      .mockRejectedValueOnce(new Error("request failed for https://reader:secret@example.org/calendar.ics"));

    const result = await fetchPublicSchedule(institution("safe-schedule-log", [
      { label: "Published calendar", url: "https://www.example.org/calendar.ics" },
      { label: "Events archive", url: "https://events.example.org/archive.ics" }
    ]));

    expect(result.degraded).toBe(true);
    expect(result.schedule).toHaveLength(1);
    expect(log).toHaveBeenCalledWith("warn", "public_schedule_source_failed", {
      source: "Events archive",
      reason: "upstream_request_failed"
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain("reader:secret");
  });
});
