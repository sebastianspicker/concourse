/** Verifies the public web-event adapter never emits or logs unsafe source URLs. */

import type { InstitutionPack } from "@concourse/institutions";
import { afterEach, describe, expect, it, vi } from "vitest";

const { fetchTextWithTimeout, log } = vi.hoisted(() => ({
  fetchTextWithTimeout: vi.fn(),
  log: vi.fn()
}));

vi.mock("../../runtime/httpClient", () => ({ fetchTextWithTimeout }));
vi.mock("../../runtime/logger", () => ({ log }));

import { clearCache } from "../../runtime/cache";
import { fetchPublicEvents } from "./hfmtWebEvents";

afterEach(() => {
  clearCache();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

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
    vi.stubEnv("PUBLIC_EVENTS_MODE", "auto");
    const result = await fetchPublicEvents(institution("unsafe-source", "https://reader:secret@example.org/events"));

    expect(result).toEqual({ events: [], degraded: true });
    expect(fetchTextWithTimeout).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it("drops unsafe event links found in otherwise public source HTML", async () => {
    vi.stubEnv("PUBLIC_EVENTS_MODE", "auto");
    fetchTextWithTimeout.mockResolvedValueOnce(`
      <a href="https://127.0.0.1/admin">Private event</a>
      <a href="https://events.example.org/recital">Campus recital</a>
    `);

    const result = await fetchPublicEvents(institution("unsafe-link", "https://www.example.org/events"));

    expect(result.degraded).toBe(false);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.sourceUrl).toBe("https://events.example.org/recital");
  });

  it("logs a stable source label instead of a failing source URL or error message", async () => {
    vi.stubEnv("PUBLIC_EVENTS_MODE", "auto");
    fetchTextWithTimeout.mockRejectedValueOnce(new Error("request failed for https://reader:secret@example.org/events"));

    const result = await fetchPublicEvents(institution("safe-log", "https://www.example.org/events"));

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
});
