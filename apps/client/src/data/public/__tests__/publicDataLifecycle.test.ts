/** Characterizes cache compatibility and deterministic static-demo data for the mobile client. */

import { afterEach, describe, expect, it, vi } from "vitest";

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
    }
  };
});

vi.mock("@react-native-async-storage/async-storage", () => ({ default: storage }));
vi.mock("@/platform/env/env", () => ({ getBffBaseUrl: () => "https://api.example.test" }));
vi.mock("@/platform/env/institution", () => ({ getConfiguredInstitutionId: () => "mockuni" }));

import {
  CACHE_STORAGE_NAMESPACE,
  clearPersistedCache,
  fetchNetworkFirstWithFallback,
  isOfflineData,
  setPersistedCache
} from "../persistedCache";
import { getPublicCacheKey } from "../publicCacheKey";
import { getStaticDemoResponse } from "../staticDemoData";
import { getCached } from "../cache";
import { clearPublicDataState } from "../publicDataLifecycle";
import { selectedEventDetails } from "../selectedDetailRecords";

afterEach(() => {
  storage.values.clear();
});

describe("mobile cache and static-demo characterization", () => {
  it("migrates a valid legacy cache entry into the concourse namespace", async () => {
    const key = "rooms";
    const raw = JSON.stringify({ data: { name: "Auditorium" }, timestamp: Date.now() });
    storage.values.set(`campus-app-kit:${key}`, raw);

    await expect(fetchNetworkFirstWithFallback(
      key,
      async () => Promise.reject(new TypeError("network unavailable")),
      (value): value is { name: string } => typeof value === "object" && value !== null && "name" in value,
    )).resolves.toMatchObject({ data: { name: "Auditorium" }, fromCache: true, isOffline: true });

    expect(JSON.parse(storage.values.get(`${CACHE_STORAGE_NAMESPACE}${key}`) ?? "{}"))
      .toMatchObject({ data: { name: "Auditorium" }, isOffline: true });
    expect(storage.values.has(`campus-app-kit:${key}`)).toBe(false);
  });

  it("clears both cache namespaces for a specific resource key", async () => {
    storage.values.set("concourse:rooms", "current");
    storage.values.set("campus-app-kit:rooms", "legacy");

    await clearPersistedCache("rooms");

    expect(storage.values.has("concourse:rooms")).toBe(false);
    expect(storage.values.has("campus-app-kit:rooms")).toBe(false);
  });

  it("returns a recent cache entry for a transient network failure and marks it offline", async () => {
    await setPersistedCache("today", { status: "cached" });

    const result = await fetchNetworkFirstWithFallback(
      "today",
      async () => Promise.reject(new TypeError("network unavailable")),
      (value): value is { status: string } => typeof value === "object" && value !== null && "status" in value
    );

    expect(result).toMatchObject({
      data: { status: "cached" },
      fromCache: true,
      isOffline: true
    });
    expect(result.cacheAge).toBeTypeOf("number");
    await expect(isOfflineData("today")).resolves.toBe(true);
  });

  it("uses one stable public cache key for equivalent query objects", () => {
    expect(getPublicCacheKey("rooms", { search: "library", campus: "main" }))
      .toBe(getPublicCacheKey("rooms", { campus: "main", search: "library" }));
    expect(getPublicCacheKey("rooms", { campus: "main", search: "library" }))
      .toBe("public:v1:https://api.example.test:mockuni:rooms?campus=main&search=library");
  });

  it("keeps static demo filters deterministic and falls back to its fixture date", () => {
    const response = getStaticDemoResponse("/events", { date: "not-a-date", search: "library" });
    const fallback = getStaticDemoResponse("/events", undefined);
    if (!("events" in response) || !("events" in fallback)) {
      throw new Error("Events fixture contract changed");
    }

    expect(response).toMatchObject({ _total: 1, _sourcesConfigured: true });
    expect(response.events[0]).toMatchObject({ id: "library-tour", title: "Library introduction" });
    expect(response.events[0]?.date).toBe(fallback.events[1]?.date);
  });

  it("clears memory, snapshots, and selected-detail handoff in one operation", async () => {
    const demo = getStaticDemoResponse("/events", undefined);
    if (!("events" in demo) || !demo.events[0]) throw new Error("Events fixture contract changed");
    selectedEventDetails.remember(demo.events[0]);
    await setPersistedCache("clear-test", { status: "saved" });
    storage.values.set("campus-app-kit:legacy-clear-test", JSON.stringify({
      data: { status: "legacy" },
      timestamp: Date.now(),
    }));
    await getCached("clear-test", async () => 1, 60_000);

    await clearPublicDataState();

    expect(selectedEventDetails.get(demo.events[0].id)).toBeNull();
    expect(storage.values.has(`${CACHE_STORAGE_NAMESPACE}clear-test`)).toBe(false);
    expect(storage.values.has("campus-app-kit:legacy-clear-test")).toBe(false);
    await expect(getCached("clear-test", async () => 2, 60_000)).resolves.toBe(2);
  });
});
