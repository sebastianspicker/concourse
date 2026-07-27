/** Covers invalid schedule-route requests and upstream failure responses. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleSchedule } from "../schedule";
import institution from "../../__fixtures__/institution.public.json";
import { invokeRoute, stubScheduleFixtureFetch } from "../../__tests__/httpMocks";
import { clearCache } from "../../utils/cache";

vi.mock("../../utils/fetch", async () => ({
  fetchTextWithTimeout: (await import("../../__tests__/fetchTextMock")).fetchTextUsingGlobalMock
}));

describe("GET /schedule: negative paths", () => {
  beforeEach(() => {
    stubScheduleFixtureFetch(clearCache);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("handles invalid limit query param (non-numeric)", async () => {
    const result = await invokeRoute(handleSchedule, institution, "/schedule?limit=abc");

    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("bad_request");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("handles negative offset query param", async () => {
    const result = await invokeRoute(handleSchedule, institution, "/schedule?offset=-1");

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("schedule");
  });

  it("handles negative limit query param", async () => {
    const result = await invokeRoute(handleSchedule, institution, "/schedule?limit=-5");

    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("bad_request");
  });

  it("returns 404 when institution has no schedule sources configured", async () => {
    const noScheduleInstitution = {
      ...institution,
      publicSources: { ...institution.publicSources, schedules: [] }
    };
    const result = await invokeRoute(handleSchedule, noScheduleInstitution, "/schedule");

    expect(result.status).toBe(404);
    expect(result.body.error.code).toBe("not_found");
  });

  it("returns 500 when upstream connector throws", async () => {
    clearCache();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Upstream timeout")));
    const result = await invokeRoute(handleSchedule, institution, "/schedule");

    expect(result.status).toBe(500);
    expect(result.body.error.code).toBe("internal_error");
  });

  it("response body contains schedule array matching schema shape", async () => {
    const result = await invokeRoute(handleSchedule, institution, "/schedule");

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("schedule");
    expect(Array.isArray(result.body.schedule)).toBe(true);
    for (const item of result.body.schedule) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("startsAt");
    }
  });

  it("handles invalid date range parameters gracefully", async () => {
    const result = await invokeRoute(
      handleSchedule,
      institution,
      "/schedule?from=not-a-date&to=also-not"
    );

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("schedule");
  });
});
