/** Coordinates cache keys, validation, persistence, and freshness metadata for public requests. */
import { ZodError, type z } from "zod";
import { getJsonResult } from "../api/client";
import { ApiErrorException } from "../api/errors";
import { getCached } from "./cache";
import { getPublicCacheKey } from "./publicCacheKey";
import { fetchNetworkFirstWithFallback } from "./persistedCache";
import { isStaticDemo } from "../config/staticDemo";
import { getStaticDemoResponse } from "./staticDemoData";

const DEFAULT_TTL_MS = 60_000;

export type RequestControls = {
  force?: boolean;
  signal?: AbortSignal;
  offlineMode?: boolean;
};

type CachedJsonOptions = RequestControls & { queryParams?: Record<string, string> };

export type ResourceLoadResult<T> = {
  data: T;
  source: "network" | "memory-cache" | "persisted-cache";
  updatedAt: number;
  cacheAge: number | null;
};

/** Converts schema-parser failures into an unavailable result instead of throwing into the UI. */
function safeParse<T>(data: unknown, schema: z.ZodType<T>): T {
  try {
    return schema.parse(data) as T;
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      throw new ApiErrorException({
        status: 502,
        code: "validation_error",
        message: "Invalid response format"
      });
    }
    throw err;
  }
}

/** Encodes only defined filters before adding them to an endpoint URL. */
function getQueryString(queryParams?: Record<string, string>): string {
  const query = queryParams ? new URLSearchParams(queryParams).toString() : "";
  return query ? `?${query}` : "";
}

/**
 * Loads a public resource through the memory and persisted-cache layers while preserving
 * whether a result is fresh, stale, or degraded for the UI.
 */
export async function getCachedJson<T>(
  path: string,
  schema: z.ZodType<T>,
  keySuffix: string,
  options?: CachedJsonOptions
): Promise<ResourceLoadResult<T>> {
  const cacheKey = getPublicCacheKey(keySuffix, options?.queryParams);
  const queryString = getQueryString(options?.queryParams);

  if (isStaticDemo()) {
    return {
      data: safeParse(getStaticDemoResponse(path, options?.queryParams), schema),
      source: "memory-cache",
      updatedAt: Date.now(),
      cacheAge: 0,
    };
  }

  if (options?.offlineMode) {
    const result = await fetchNetworkFirstWithFallback<T>(
      cacheKey,
      async () => (await getJsonResult<T>(`${path}${queryString}`, (data) => safeParse(data, schema), { signal: options?.signal })).data,
      (value): value is T => schema.safeParse(value).success
    );
    return {
      data: result.data,
      source: result.fromCache ? "persisted-cache" : "network",
      updatedAt: Date.now() - (result.cacheAge ?? 0),
      cacheAge: result.cacheAge
    };
  }

  const data = await getCached(
    cacheKey,
    () =>
      getJsonResult<T>(`${path}${queryString}`, (value) => safeParse(value, schema), { signal: options?.signal }).then((result) => result.data),
    DEFAULT_TTL_MS,
    options?.force ?? false
  );
  return { data, source: "memory-cache", updatedAt: Date.now(), cacheAge: 0 };
}
