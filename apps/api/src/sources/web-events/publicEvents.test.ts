/** Verifies the public web-event adapter never emits or logs unsafe source URLs. */

import type { InstitutionPack } from "@concourse/institutions";
import { afterEach, describe, expect, it, vi } from "vitest";

const { fetchTextWithTimeout, log } = vi.hoisted(() => ({
  fetchTextWithTimeout: vi.fn(),
  log: vi.fn()
}));

vi.mock("../upstream/httpClient", () => ({ fetchTextWithTimeout }));
vi.mock("../../runtime/logger", () => ({ log }));

import { clearCache } from "../upstream/cache";
import { fetchPublicEvents } from "./publicEvents";

afterEach(() => {
  clearCache();
  vi.clearAllMocks();
});

const OPTIONS = { cacheTtlMs: 300_000, mode: "auto" };

function institution(id: string, url: string): InstitutionPack {
  return {
    id,
    name: "Example University",
    type: "university",
    campuses: [],
    publicSources: { events: [{ label: "Campus calendar", url }] }
  };
}

describe("fetchPublicEvents", () => {
  it("drops an unsafe source that bypassed pack validation without fetching or exposing it", async () => {
    const result = await fetchPublicEvents(institution("unsafe-source", "https://reader:secret@example.org/events"), OPTIONS);

    expect(result).toEqual({ events: [], degraded: true });
    expect(fetchTextWithTimeout).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it("drops unsafe event links found in otherwise public source HTML", async () => {
    fetchTextWithTimeout.mockResolvedValueOnce(`
      <a href="https://127.0.0.1/admin">Private event</a>
      <a href="https://events.example.org/recital">Campus recital</a>
    `);

    const result = await fetchPublicEvents(institution("unsafe-link", "https://www.example.org/events"), OPTIONS);

    expect(result.degraded).toBe(false);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.sourceUrl).toBe("https://events.example.org/recital");
  });

  it("logs a stable source label instead of a failing source URL or error message", async () => {
    fetchTextWithTimeout.mockRejectedValueOnce(new Error("request failed for https://reader:secret@example.org/events"));

    const result = await fetchPublicEvents(institution("safe-log", "https://www.example.org/events"), OPTIONS);

    expect(result).toEqual({
      events: [{
        id: expect.any(String),
        title: "Campus calendar",
        date: expect.any(String),
        sourceUrl: "https://www.example.org/events"
      }],
      degraded: true
    });
    expect(log).toHaveBeenCalledWith("warn", "public_events_source_failed", {
      source: "Campus calendar",
      reason: "upstream_request_failed"
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain("reader:secret");
  });

  it("bounds malformed HTML scanning and keeps the source-label fallback", async () => {
    fetchTextWithTimeout.mockResolvedValueOnce([
      "<article>".repeat(4_000),
      '<div class="event">'.repeat(4_000),
      '<a href="/event">'.repeat(4_000),
    ].join(""));

    const result = await fetchPublicEvents(institution("malformed-html", "https://www.hfmt-koeln.de/veranstaltungen"), OPTIONS);

    expect(result).toEqual({
      events: [{
        id: expect.any(String),
        title: "Campus calendar",
        date: expect.any(String),
        sourceUrl: "https://www.hfmt-koeln.de/veranstaltungen"
      }],
      degraded: true
    });
  });

  it("keeps ordinary HfMT article extraction", async () => {
    fetchTextWithTimeout.mockResolvedValueOnce(`
      <article data-event-title="Public recital" data-event-url="/veranstaltungen/recital">
        <time datetime="2026-11-04T19:30:00+01:00"></time>
      </article>
    `);

    const result = await fetchPublicEvents(institution("hfmt-article", "https://www.hfmt-koeln.de/veranstaltungen"), OPTIONS);

    expect(result).toMatchObject({
      degraded: false,
      events: [{ title: "Public recital", sourceUrl: "https://www.hfmt-koeln.de/veranstaltungen/recital" }]
    });
  });

  it("preserves offsets around Unicode text and quoted greater-than characters", async () => {
    fetchTextWithTimeout.mockResolvedValueOnce(`
      ${"İ".repeat(10)}
      <article data-event-title="İstanbul recital > Encore" data-event-url="/veranstaltungen/encore">
        <time datetime="2026-11-04T19:30:00+01:00"></time>
      </article>
    `);

    const result = await fetchPublicEvents(institution("hfmt-unicode", "https://www.hfmt-koeln.de/veranstaltungen"), OPTIONS);

    expect(result).toMatchObject({
      degraded: false,
      events: [{
        title: "İstanbul recital > Encore",
        sourceUrl: "https://www.hfmt-koeln.de/veranstaltungen/encore"
      }]
    });
  });
});
