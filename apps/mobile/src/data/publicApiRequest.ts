import type { z } from "zod";
import { ZodError } from "zod";
import { getJsonResult } from "../api/client";
import { ApiErrorException } from "../api/errors";
import { getCached } from "./cache";
import { getPublicCacheKey } from "./publicCacheKey";
import { fetchNetworkFirstWithFallback } from "./persistedCache";

const DEFAULT_TTL_MS = 60_000;

type CachedJsonOptions = {
  force?: boolean;
  signal?: AbortSignal;
  queryParams?: Record<string, string>;
  offlineMode?: boolean;
};

export type ResourceLoadResult<T> = {
  data: T;
  source: "network" | "memory-cache" | "persisted-cache";
  updatedAt: number;
  cacheAge: number | null;
};

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

function getQueryString(queryParams?: Record<string, string>): string {
  return queryParams ? `?${new URLSearchParams(queryParams).toString()}` : "";
}

export async function getCachedJson<T>(
  path: string,
  schema: z.ZodType<T>,
  keySuffix: string,
  options?: CachedJsonOptions
): Promise<ResourceLoadResult<T>> {
  const cacheKey = getPublicCacheKey(keySuffix, options?.queryParams);
  const queryString = getQueryString(options?.queryParams);

  if (options?.offlineMode) {
    const result = await fetchNetworkFirstWithFallback<T>(
      cacheKey,
      async () => (await getJsonResult<T>(`${path}${queryString}`, (data) => safeParse(data, schema), { signal: options?.signal })).data
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
