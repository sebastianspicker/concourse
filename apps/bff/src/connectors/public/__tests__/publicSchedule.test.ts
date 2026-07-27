/** Exercises public schedule retrieval, parsing, caching, and degradation behavior. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fetchPublicSchedule } from "../publicSchedule";
import { clearCache } from "../../../utils/cache";

vi.mock("../../../utils/fetch", async () => ({
  fetchTextWithTimeout: (await import("../../../__tests__/fetchTextMock")).fetchTextUsingGlobalMock
}));

const institution = {
  id: "hfmt",
  name: "HfMT",
  type: "music-and-dance",
  campuses: [],
  publicSources: {
    schedules: [
      {
        label: "Public Calendar",
        url: "https://example.org/schedule.ics"
      }
    ]
  }
};

function stubScheduleFetch(): void {
  const ics = readFileSync(
    new URL("../../../__fixtures__/schedule.ics", import.meta.url),
    "utf8"
  );
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(ics)));
}

describe("fetchPublicSchedule", () => {
  beforeEach(() => {
    clearCache();

    stubScheduleFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses schedule and campus id", async () => {
    const result = await fetchPublicSchedule(institution);

    expect(result.degraded).toBe(false);
    expect(result.schedule.length).toBe(2);
    expect(result.schedule[0].campusId).toBe("cologne");
  });

  it("throws on fetch failure so empty upstream failures are not cached as valid data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));

    await expect(fetchPublicSchedule(institution)).rejects.toThrow("All public schedule sources failed");
  });
});
