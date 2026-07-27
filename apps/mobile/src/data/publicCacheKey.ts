/** Builds institution- and endpoint-specific keys that prevent public-cache cross-contamination. */
import { getBffBaseUrl } from "../utils/env";
import { getConfiguredInstitutionId } from "../config/institution";

export const PUBLIC_CACHE_SCHEMA_VERSION = 1;

/** Canonicalizes query parameters so equivalent filter objects share a persisted key. */
function getSortedQueryString(queryParams?: Record<string, string>): string {
  if (!queryParams || Object.keys(queryParams).length === 0) {
    return "";
  }

  const sortedParams = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams).sort(([a], [b]) => a.localeCompare(b))) {
    sortedParams.append(key, value);
  }
  return sortedParams.toString();
}

/** Namespaces cached public data by API origin, institution, schema version, endpoint, and filters. */
export function getPublicCacheKey(suffix: string, queryParams?: Record<string, string>): string {
  try {
    // Include the BFF base URL so preview/prod/dev endpoints do not share
    // persisted responses when a tester switches environments.
    const base = `public:v${PUBLIC_CACHE_SCHEMA_VERSION}:${getBffBaseUrl()}:${getConfiguredInstitutionId()}:${suffix}`;
    const queryString = getSortedQueryString(queryParams);
    return queryString ? `${base}?${queryString}` : base;
  } catch {
    return `public:v${PUBLIC_CACHE_SCHEMA_VERSION}:${getConfiguredInstitutionId()}:${suffix}`;
  }
}
