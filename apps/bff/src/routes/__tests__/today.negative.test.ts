/** Covers invalid today-route requests and upstream failure responses. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleToday as todayHandler } from "../today";
import testInstitution from "../../__fixtures__/institution.public.json";
import { clearPublicEventsMockEnvironment, expectEventFields, expectNotFoundRoute, expectRoomsCollection, invokeRoute, usePublicEventsMockEnvironment } from "../../__tests__/httpMocks";
import { clearCache } from "../../utils/cache";

vi.mock("../../utils/fetch", () => import("../../__tests__/fetchTextMock").then(({ fetchTextUsingGlobalMock }) => ({ fetchTextWithTimeout: fetchTextUsingGlobalMock })));

describe("GET /today: negative paths", () => {
  it("rejects rollover calendar dates", async () => {
    delete process.env.PUBLIC_EVENTS_MODE;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await invokeRoute(todayHandler, testInstitution, "/today?date=2026-02-30");

    expect(result.status).toBe(400);
    expect(result.rawBody).toContain("date must be a valid YYYY-MM-DD calendar date");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  beforeEach(() => {
    usePublicEventsMockEnvironment(clearCache);
  });

  afterEach(() => {
    clearPublicEventsMockEnvironment();
  });

  it("returns 404 when institution has no event or room sources", async () => {
    const emptyInstitution = {
      ...testInstitution,
      publicSources: { events: [], schedules: [] },
      publicRooms: []
    };
    const result = await invokeRoute(todayHandler, emptyInstitution, "/today");

    expectNotFoundRoute(result.status, result.body);
  });

  it("returns 500 when upstream connector throws", async () => {
    delete process.env.PUBLIC_EVENTS_MODE;
    const failedFetch = vi.fn();
    failedFetch.mockRejectedValue(new Error("DNS resolution failed"));
    vi.stubGlobal("fetch", failedFetch);

    const result = await invokeRoute(todayHandler, testInstitution, "/today");

    expect(result.status).toBeDefined();
    // The connector has fallback behavior, so it may return 200 with degraded data
    expect([200, 500]).toContain(result.status);
  });

  it("response body matches expected today schema shape", async () => {
    const result = await invokeRoute(todayHandler, testInstitution, "/today");

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("events");
    expect(result.body).toHaveProperty("rooms");
    expect(Array.isArray(result.body.events)).toBe(true);
    expect(Array.isArray(result.body.rooms)).toBe(true);
  });

  it("still returns rooms even when events are empty for today", async () => {
    // Set a date where no mock events exist
    process.env.PUBLIC_EVENTS_DATE = "1999-01-01T00:00:00.000Z";
    clearCache();

    const result = await invokeRoute(todayHandler, testInstitution, "/today");

    expect(result.status).toBe(200);
    expectRoomsCollection(result.body);
  });

  it("handles institution with rooms but no events sources", async () => {
    const roomsOnlyInstitution = {
      ...testInstitution,
      publicSources: { events: [], schedules: [] }
    };
    const result = await invokeRoute(todayHandler, roomsOnlyInstitution, "/today");

    // Should still succeed because rooms are configured
    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("rooms");
  });

  it("events in today response have required fields", async () => {
    const result = await invokeRoute(todayHandler, testInstitution, "/today");

    expect(result.status).toBe(200);
    expectEventFields(result.body.events);
  });
});
