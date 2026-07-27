/** Exercises public event-route filtering and successful responses. */

import { beforeEach, describe, expect, it } from "vitest";
import { handleEvents } from "../events";
import institution from "../../__fixtures__/institution.public.json";
import eventsFixture from "../../__fixtures__/events.json";
import { invokeRoute } from "../../__tests__/httpMocks";
import { clearCache } from "../../utils/cache";

describe("GET /events", () => {
  beforeEach(() => {
    process.env.PUBLIC_EVENTS_DATE = "2020-01-01T00:00:00.000Z";
    process.env.PUBLIC_EVENTS_MODE = "mock";
    clearCache();
  });

  it("returns public events", async () => {
    const result = await invokeRoute(handleEvents, institution);

    expect(result.status).toBe(200);
    expect(result.body).toEqual(eventsFixture);
  });

  it("includes _total equal to events array length", async () => {
    const result = await invokeRoute(handleEvents, institution);

    expect(result.status).toBe(200);
    expect(result.body._total).toBe(result.body.events.length);
  });
});
