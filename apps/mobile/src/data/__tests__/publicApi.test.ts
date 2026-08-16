/** Verifies that typed public fetchers dispatch their fixed endpoint contracts through the cache boundary. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EventsResponseSchema,
  RoomsResponseSchema,
  ScheduleResponseSchema,
  TodayResponseSchema,
} from "@concourse/shared";

const { getCachedJson } = vi.hoisted(() => ({ getCachedJson: vi.fn() }));

vi.mock("../publicApiRequest", () => ({ getCachedJson }));

import { fetchEvents, fetchRooms, fetchSchedule, fetchToday } from "../publicApi";

const signals = {
  events: new AbortController().signal,
  rooms: new AbortController().signal,
  today: new AbortController().signal,
  schedule: new AbortController().signal,
};

describe("public API endpoint dispatch", () => {
  beforeEach(() => {
    getCachedJson.mockReset();
    getCachedJson.mockResolvedValue({
      data: {},
      source: "network",
      updatedAt: 0,
      cacheAge: null,
    });
  });

  it.each([
    {
      name: "events",
      fetcher: () => fetchEvents({
        search: "",
        from: undefined,
        to: "2026-08-11",
        limit: 0,
        offset: 4,
        force: true,
        signal: signals.events,
        offlineMode: true,
      }),
      path: "/events",
      schema: EventsResponseSchema,
      keySuffix: "events",
      queryParams: { to: "2026-08-11", limit: "0", offset: "4" },
      controls: { force: true, signal: signals.events, offlineMode: true },
    },
    {
      name: "rooms",
      fetcher: () => fetchRooms({
        campus: "",
        search: "library",
        limit: 0,
        offset: undefined,
        force: false,
        signal: signals.rooms,
        offlineMode: false,
      }),
      path: "/rooms",
      schema: RoomsResponseSchema,
      keySuffix: "rooms",
      queryParams: { search: "library", limit: "0" },
      controls: { force: false, signal: signals.rooms, offlineMode: false },
    },
    {
      name: "today",
      fetcher: () => fetchToday({
        date: "",
        force: true,
        signal: signals.today,
        offlineMode: false,
      }),
      path: "/today",
      schema: TodayResponseSchema,
      keySuffix: "today",
      queryParams: {},
      controls: { force: true, signal: signals.today, offlineMode: false },
    },
    {
      name: "schedule",
      fetcher: () => fetchSchedule({
        search: "orientation",
        from: "",
        to: undefined,
        campus: "north",
        limit: 0,
        offset: 9,
        force: false,
        signal: signals.schedule,
        offlineMode: true,
      }),
      path: "/schedule",
      schema: ScheduleResponseSchema,
      keySuffix: "schedule",
      queryParams: { search: "orientation", campus: "north", limit: "0", offset: "9" },
      controls: { force: false, signal: signals.schedule, offlineMode: true },
    },
  ])("dispatches $name with only query filters", async ({ fetcher, path, schema, keySuffix, queryParams, controls }) => {
    await fetcher();

    expect(getCachedJson).toHaveBeenCalledWith(path, schema, keySuffix, {
      ...controls,
      queryParams,
    });
  });

  it("preserves errors from the shared request boundary", async () => {
    const failure = new Error("network unavailable");
    getCachedJson.mockRejectedValueOnce(failure);

    await expect(fetchEvents()).rejects.toBe(failure);
  });
});
