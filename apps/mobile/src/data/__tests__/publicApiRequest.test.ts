/** Verifies cache provenance, timestamps, and degraded-state metadata returned by public requests. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import Constants from "expo-constants";
import {
  EventsResponseSchema,
  RoomsResponseSchema,
  ScheduleResponseSchema,
  TodayResponseSchema,
} from "@concourse/shared";
import { getCachedJson } from "../publicApiRequest";
import { clearPersistedCache, setPersistedCache } from "../persistedCache";
import { getPublicCacheKey } from "../publicCacheKey";
import { _resetBffBaseUrlMemoForTests } from "../../utils/bffConfig";
import { jsonResponse } from "../../test/httpResponse";

const expoExtra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;

describe("resource metadata", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "http://localhost:4000";
    vi.stubGlobal("__DEV__", true);
    _resetBffBaseUrlMemoForTests();
    delete expoExtra?.staticDemo;
  });
  afterEach(async () => {
    vi.unstubAllGlobals();
    await clearPersistedCache();
    delete process.env.EXPO_PUBLIC_BFF_BASE_URL;
    delete expoExtra?.staticDemo;
  });

  it("labels fresh network data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ value: 1 }, 200, () => "example")));
    const result = await getCachedJson("/test", z.object({ value: z.number() }), "test", { offlineMode: true });
    expect(result).toMatchObject({ data: { value: 1 }, source: "network", cacheAge: null });
  });

  it("does not append a trailing question mark for an empty query", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ value: 1 }, 200, () => "example"));
    vi.stubGlobal("fetch", fetch);

    await getCachedJson("/test", z.object({ value: z.number() }), "test", { offlineMode: true, queryParams: {} });

    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/test", expect.any(Object));
  });

  it("labels the rendered persisted fallback with its own age", async () => {
    await setPersistedCache(getPublicCacheKey("test"), { value: 2 });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    const result = await getCachedJson("/test", z.object({ value: z.number() }), "test", { offlineMode: true });
    expect(result.source).toBe("persisted-cache");
    expect(result.cacheAge).toBeGreaterThanOrEqual(0);
    expect(result.data.value).toBe(2);
  });

  it("rejects an incompatible persisted payload instead of rendering it offline", async () => {
    await setPersistedCache(getPublicCacheKey("test"), { value: "old shape" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(getCachedJson("/test", z.object({ value: z.number() }), "test", { offlineMode: true }))
      .rejects.toThrow("offline");
  });

  it("serves every static-demo endpoint without invoking the network", async () => {
    if (!expoExtra) throw new Error("Expo runtime config is unavailable in this test");
    expoExtra.staticDemo = true;
    const fetch = vi.fn().mockRejectedValue(new Error("network must not be called"));
    vi.stubGlobal("fetch", fetch);

    const events = await getCachedJson("/events", EventsResponseSchema, "events", {
      offlineMode: true,
      queryParams: { date: "2026-08-09", search: "concert" },
    });
    const rooms = await getCachedJson("/rooms", RoomsResponseSchema, "rooms", {
      queryParams: { search: "library" },
    });
    const schedule = await getCachedJson("/schedule", ScheduleResponseSchema, "schedule", {
      queryParams: { from: "2026-08-09", search: "orientation" },
    });
    const today = await getCachedJson("/today", TodayResponseSchema, "today", {
      queryParams: { date: "2026-08-09" },
    });

    expect(events).toMatchObject({ source: "memory-cache", cacheAge: 0 });
    expect(events.data.events).toHaveLength(1);
    expect(events.data.events[0]?.title).toBe("Welcome concert");
    expect(rooms.data.rooms).toMatchObject([{ id: "library" }]);
    expect(schedule.data.schedule).toMatchObject([{ id: "orientation" }]);
    expect(today.data.events[0]?.date).toBe("2026-08-09T17:30:00.000Z");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects unsupported static-demo routes without invoking the network", async () => {
    if (!expoExtra) throw new Error("Expo runtime config is unavailable in this test");
    expoExtra.staticDemo = true;
    const fetch = vi.fn().mockRejectedValue(new Error("network must not be called"));
    vi.stubGlobal("fetch", fetch);

    await expect(getCachedJson("/unknown", EventsResponseSchema, "unknown")).rejects
      .toThrow("Static demo does not provide /unknown");
    expect(fetch).not.toHaveBeenCalled();
  });
});
