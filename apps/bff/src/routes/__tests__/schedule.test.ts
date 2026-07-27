/** Exercises public schedule-route filtering and successful responses. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchTextUsingGlobalMock } from "../../__tests__/fetchTextMock";
import { handleSchedule } from "../schedule";
import institution from "../../__fixtures__/institution.public.json";
import scheduleFixture from "../../__fixtures__/schedule.json";
import { invokeRoute, stubScheduleFixtureFetch } from "../../__tests__/httpMocks";
import { clearCache } from "../../utils/cache";

vi.mock("../../utils/fetch", () => ({ fetchTextWithTimeout: fetchTextUsingGlobalMock }));

describe("GET /schedule", () => {
  beforeEach(() => {
    stubScheduleFixtureFetch(clearCache);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed schedule", async () => {
    const result = await invokeRoute(handleSchedule, institution);

    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      ...scheduleFixture,
      _degraded: false
    });
  });

  it("includes _total equal to schedule array length", async () => {
    const result = await invokeRoute(handleSchedule, institution);

    expect(result.body._total).toBe(result.body.schedule.length);
  });
});
