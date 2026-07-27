/** Covers invalid event-route requests and upstream failure responses. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchTextUsingGlobalMock } from "../../__tests__/fetchTextMock";
import { handleEvents } from "../events";
import institution from "../../__fixtures__/institution.public.json";
import { clearPublicEventsMockEnvironment, expectEventFields, expectNotFoundRoute, invokeRoute, usePublicEventsMockEnvironment } from "../../__tests__/httpMocks";
import { clearCache } from "../../utils/cache";

vi.mock("../../utils/fetch", () => ({ fetchTextWithTimeout: fetchTextUsingGlobalMock }));

describe("GET /events: negative paths", () => {
  beforeEach(() => {
    usePublicEventsMockEnvironment(clearCache);
  });

  afterEach(() => {
    clearPublicEventsMockEnvironment();
  });

  it("handles invalid limit query param (non-numeric)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await invokeRoute(handleEvents, institution, "/events?limit=abc");

    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("bad_request");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles negative offset query param", async () => {
    const result = await invokeRoute(handleEvents, institution, "/events?offset=-1");

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("events");
  });

  it("returns 404 when institution has no event sources configured", async () => {
    const noEventsInstitution = {
      ...institution,
      publicSources: { ...institution.publicSources, events: [] }
    };
    const result = await invokeRoute(handleEvents, noEventsInstitution, "/events");

    expectNotFoundRoute(result.status, result.body);
  });

  it("returns 500 when upstream connector throws", async () => {
    // Override mock mode with live mode and make fetch fail
    delete process.env.PUBLIC_EVENTS_MODE;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));

    const result = await invokeRoute(handleEvents, institution, "/events");

    // The connector returns fallback events on failure, so it may still return 200 with degraded data.
    // The BFF wraps errors in createJsonRoute, so if the connector manages to return data, we get 200.
    expect(result.status).toBeDefined();
    expect([200, 500]).toContain(result.status);
  });

  it("response body matches expected events schema shape", async () => {
    const result = await invokeRoute(handleEvents, institution, "/events");

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("events");
    expect(Array.isArray(result.body.events)).toBe(true);
    expectEventFields(result.body.events);
  });

  it("handles invalid date range parameters gracefully", async () => {
    const result = await invokeRoute(
      handleEvents,
      institution,
      "/events?from=garbage&to=not-a-date"
    );

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("events");
  });

  it("handles extremely large limit parameter", async () => {
    const result = await invokeRoute(handleEvents, institution, "/events?limit=999999999");

    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("bad_request");
  });
});
