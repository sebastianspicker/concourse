/** Exercises the current-day event route and its date selection behavior. */

import { beforeEach, describe, expect, it } from "vitest";
import { handleToday } from "../today";
import institution from "../../__fixtures__/institution.public.json";
import todayFixture from "../../__fixtures__/today.json";
import { invokeRoute } from "../../__tests__/httpMocks";
import { clearCache } from "../../utils/cache";

describe("GET /today", () => {
  beforeEach(() => {
    process.env.PUBLIC_EVENTS_DATE = "2020-01-01T00:00:00.000Z";
    process.env.PUBLIC_EVENTS_MODE = "mock";
    clearCache();
  });

  it("returns a public today payload", async () => {
    const result = await invokeRoute(handleToday, institution);

    expect(result.status).toBe(200);
    expect(result.body).toEqual(todayFixture);
  });
});
