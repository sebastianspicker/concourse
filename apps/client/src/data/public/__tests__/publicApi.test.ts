/** Verifies public BFF route, validation, retry, and persisted-fallback contracts. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: async (key: string) => {
      values.delete(key);
    },
    getAllKeys: async () => [...values.keys()],
    multiRemove: async (keys: readonly string[]) => {
      for (const key of keys) values.delete(key);
    },
  };
});

vi.mock("@react-native-async-storage/async-storage", () => ({ default: storage }));
vi.mock("@/platform/env/env", () => ({ getBffBaseUrl: () => "https://api.example.test" }));
vi.mock("@/platform/env/institution", () => ({ getConfiguredInstitutionId: () => "example" }));
vi.mock("@/data/public/staticDemo", () => ({ isStaticDemo: () => false }));

import { ApiErrorException } from "@/platform/http/errors";
import { toUiError } from "@/platform/http/uiError";
import { clearCache } from "../cache";
import { getPublicCacheKey } from "../publicCacheKey";
import { fetchEvents, fetchRooms, fetchSchedule, fetchToday } from "../publicApi";
import { fetchNetworkFirstWithFallback, setPersistedCache } from "../persistedCache";
import { parseRetryAfterSeconds } from "@/platform/http/retryAfter";

const event = {
  id: "open-house",
  title: "Open house",
  date: "2026-09-14T09:00:00.000Z",
  sourceUrl: "https://example.test/events/open-house",
};
const room = { id: "library", name: "Library", campusId: "main" };
const scheduleItem = {
  id: "orientation",
  title: "Orientation",
  startsAt: "2026-09-14T08:00:00.000Z",
};

function jsonResponse(body: unknown, institutionId = "example", status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "x-institution-id": institutionId, ...headers },
  });
}

describe("public BFF data contract", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    storage.values.clear();
    clearCache();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    clearCache();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("requests all public routes and serializes only endpoint filters", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ events: [event], _total: 1 }))
      .mockResolvedValueOnce(jsonResponse({ rooms: [room], _total: 1 }))
      .mockResolvedValueOnce(jsonResponse({ events: [event], rooms: [room] }))
      .mockResolvedValueOnce(jsonResponse({ schedule: [scheduleItem], _total: 1 }));

    await expect(fetchEvents({
      search: "open house",
      from: "2026-09-14T00:00:00.000Z",
      to: "2026-09-14T23:59:59.999Z",
      limit: 5,
      offset: 0,
      force: true,
    })).resolves.toMatchObject({ data: { events: [event] }, source: "memory-cache" });
    await expect(fetchRooms({ campus: "main", search: "library", limit: 10, offset: 0, force: true })).resolves.toMatchObject({ data: { rooms: [room] } });
    await expect(fetchToday({ date: "2026-09-14", force: true })).resolves.toMatchObject({ data: { events: [event], rooms: [room] } });
    await expect(fetchSchedule({ campus: "main", search: "orientation", from: "2026-09-14T00:00:00.000Z", to: "2026-09-14T23:59:59.999Z", limit: 5, offset: 0, force: true })).resolves.toMatchObject({ data: { schedule: [scheduleItem] } });

    const requests = fetchMock.mock.calls.map(([url]) => new URL(String(url)));
    expect(requests.map((url) => url.pathname)).toEqual(["/events", "/rooms", "/today", "/schedule"]);
    expect(Object.fromEntries(requests[0]!.searchParams)).toEqual({
      search: "open house",
      from: "2026-09-14T00:00:00.000Z",
      to: "2026-09-14T23:59:59.999Z",
      limit: "5",
      offset: "0",
    });
    expect(Object.fromEntries(requests[1]!.searchParams)).toEqual({ campus: "main", search: "library", limit: "10", offset: "0" });
    expect(Object.fromEntries(requests[2]!.searchParams)).toEqual({ date: "2026-09-14" });
    expect(Object.fromEntries(requests[3]!.searchParams)).toEqual({
      campus: "main",
      search: "orientation",
      from: "2026-09-14T00:00:00.000Z",
      to: "2026-09-14T23:59:59.999Z",
      limit: "5",
      offset: "0",
    });
  });

  it("rejects a schema-invalid API response as a normalized validation failure", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ events: [{ ...event, sourceUrl: undefined }] }));

    await expect(fetchEvents({ force: true })).rejects.toMatchObject({ code: "validation_error", status: 502 });
    expect(toUiError(new ApiErrorException({ code: "validation_error", status: 502, message: "invalid" }))).toEqual({ kind: "invalidResponse" });
  });

  it("rejects data served for a different institution before it reaches a resource", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ rooms: [room] }, "another-campus"));

    await expect(fetchRooms({ force: true })).rejects.toMatchObject({ code: "institution_mismatch", status: 409 });
    expect(toUiError(new ApiErrorException({ code: "institution_mismatch", status: 409, message: "mismatch" }))).toEqual({ kind: "institutionMismatch" });
  });

  it("retries transient fetched responses and retains Retry-After guidance in the final semantic error", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { code: "upstream_unavailable", message: "try later" } }, "example", 503))
      .mockResolvedValueOnce(jsonResponse({ events: [event], rooms: [room] }));

    const result = fetchToday({ force: true });
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(result).resolves.toMatchObject({ data: { events: [event], rooms: [room] } });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockReset();
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(
      { error: { code: "rate_limited", message: "wait" } },
      "example",
      429,
      { "retry-after": "1" },
    )));
    const exhausted = fetchToday({ force: true });
    const capturedError = exhausted.then(
      () => new Error("Expected the rate-limited request to fail"),
      (reason: unknown) => reason,
    );
    await vi.advanceTimersByTimeAsync(3_000);
    const error = await capturedError;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(toUiError(error)).toEqual({ kind: "rateLimit", retryAfterInSeconds: 1 });
    expect(parseRetryAfterSeconds("-10")).toBe(0);
  });

  it("uses only fresh validated persisted data for eligible transient failures", async () => {
    const eligibleKey = getPublicCacheKey("events", { search: "open house" });
    const ineligibleKey = getPublicCacheKey("rooms", { campus: "main" });
    await setPersistedCache(eligibleKey, { events: [event] });
    await setPersistedCache(ineligibleKey, { rooms: [room] });

    await expect(fetchNetworkFirstWithFallback(
      eligibleKey,
      async () => Promise.reject(new ApiErrorException({ code: "upstream_unavailable", status: 503, message: "down" })),
      (value): value is { events: (typeof event)[] } => typeof value === "object" && value !== null && "events" in value,
    )).resolves.toMatchObject({ data: { events: [event] }, fromCache: true, isOffline: true });

    await expect(fetchNetworkFirstWithFallback(
      ineligibleKey,
      async () => Promise.reject(new ApiErrorException({ code: "validation_error", status: 502, message: "invalid" })),
      (value): value is { rooms: (typeof room)[] } => typeof value === "object" && value !== null && "rooms" in value,
    )).rejects.toMatchObject({ code: "validation_error", status: 502 });
  });
});
