import type { z } from "zod";
import { ZodError } from "zod";
import { getJson } from "../api/client";
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
): Promise<T> {
  const cacheKey = getPublicCacheKey(keySuffix, options?.queryParams);
  const queryString = getQueryString(options?.queryParams);

  if (options?.offlineMode) {
    const result = await fetchNetworkFirstWithFallback<T>(
      cacheKey,
      () => getJson<T>(`${path}${queryString}`, (data) => safeParse(data, schema), { signal: options?.signal })
    );
    return result.data;
  }

  return getCached(
    cacheKey,
    () =>
      getJson<T>(`${path}${queryString}`, (data) => safeParse(data, schema), { signal: options?.signal }),
    DEFAULT_TTL_MS,
    options?.force ?? false
  );
}
