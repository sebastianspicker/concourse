import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fetchPublicEvents } from "../hfmtWebEvents";
import { clearCache } from "../../../utils/cache";

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

describe("fetchPublicEvents", () => {
  beforeEach(() => {
    clearCache();
    process.env.PUBLIC_EVENTS_MODE = "auto";
    process.env.PUBLIC_EVENTS_DATE = "2020-01-01T00:00:00.000Z";

    const html = readFileSync(
      new URL("../../../__fixtures__/hfmt-events.html", import.meta.url),
      "utf8"
    );

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      body: null,
      text: async () => html
    }));
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
    const html = readFileSync(
      new URL("../../../__fixtures__/hfmt-events-fallback.html", import.meta.url),
      "utf8"
    );

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      body: null,
      text: async () => html
    }));

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
      text: async () => readFileSync(
        new URL("../../../__fixtures__/hfmt-events.html", import.meta.url),
        "utf8"
      )
    }));

    const degraded = await fetchPublicEvents(institution);
    const recovered = await fetchPublicEvents(institution);

    expect(degraded.degraded).toBe(true);
    expect(recovered.degraded).toBe(false);
    expect(recovered.events.length).toBe(2);
  });
});
