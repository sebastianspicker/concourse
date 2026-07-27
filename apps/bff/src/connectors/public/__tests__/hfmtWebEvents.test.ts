/** Exercises public HfMT event retrieval, parsing, caching, and degradation behavior. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fetchPublicEvents } from "../hfmtWebEvents";
import { clearCache } from "../../../utils/cache";

vi.mock("../../../utils/fetch", () => import("../../../__tests__/fetchTextMock").then(
  ({ fetchTextUsingGlobalMock }) => ({ fetchTextWithTimeout: fetchTextUsingGlobalMock })
));

const institution = {
  id: "hfmt",
  name: "HfMT",
  type: "music-and-dance",
  campuses: [],
  publicSources: {
    events: [
      {
        label: "Official Events",
        url: "https://www.hfmt-koeln.de/veranstaltungen"
      }
    ]
  }
};

function fixtureHtml(name: "hfmt-events.html" | "hfmt-events-fallback.html"): string {
  return readFileSync(new URL(`../../../__fixtures__/${name}`, import.meta.url), "utf8");
}

function stubSuccessfulFetch(html: string): void {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(html)));
}

describe("fetchPublicEvents", () => {
  beforeEach(() => {
    clearCache();
    process.env.PUBLIC_EVENTS_MODE = "auto";
    process.env.PUBLIC_EVENTS_DATE = "2020-01-01T00:00:00.000Z";

    stubSuccessfulFetch(fixtureHtml("hfmt-events.html"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses HfMT events", async () => {
    const { events, degraded } = await fetchPublicEvents(institution);

    expect(events.length).toBe(2);
    expect(events[0].title).toBe("Spring Concert");
    expect(events[0].date).toBe("2024-03-10T18:00:00.000Z");
    expect(events[0].sourceUrl).toBe(
      "https://www.hfmt-koeln.de/veranstaltungen/spring-concert"
    );
    expect(degraded).toBe(false);
  });

  it("falls back to tile attributes and anchor parsing", async () => {
    stubSuccessfulFetch(fixtureHtml("hfmt-events-fallback.html"));

    const { events } = await fetchPublicEvents(institution);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].title).toBe("Piano Recital");
    expect(events[0].sourceUrl).toBe(
      "https://www.hfmt-koeln.de/veranstaltungen/piano-recital"
    );
  });

  it("falls back to mock when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));

    const { events, degraded } = await fetchPublicEvents(institution);
    expect(events.length).toBe(1);
    expect(events[0].title).toBe("Official Events");
    expect(degraded).toBe(true);
  });

  it("does not cache degraded results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null },
      body: null,
      text: async () => fixtureHtml("hfmt-events.html")
    }));

    const degraded = await fetchPublicEvents(institution);
    const recovered = await fetchPublicEvents(institution);

    expect(degraded.degraded).toBe(true);
    expect(recovered.degraded).toBe(false);
    expect(recovered.events.length).toBe(2);
  });
});
