import { getBffBaseUrl } from "../utils/env";

function getSortedQueryString(queryParams?: Record<string, string>): string {
  if (!queryParams || Object.keys(queryParams).length === 0) {
    return "";
  }

  return Object.entries(queryParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function getPublicCacheKey(suffix: string, queryParams?: Record<string, string>): string {
  try {
    // Include the BFF base URL so preview/prod/dev endpoints do not share
    // persisted responses when a tester switches environments.
    const base = `public:${getBffBaseUrl()}:${suffix}`;
    const queryString = getSortedQueryString(queryParams);
    return queryString ? `${base}?${queryString}` : base;
  } catch {
    return `public:${suffix}`;
  }
}
