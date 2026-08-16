/** Fetches typed BFF JSON with institution headers, timeouts, retries, and response metadata. */
import { getBffBaseUrl } from "../utils/env";
import { isDevelopmentBffEnvironment } from "../utils/bffConfig";
import { fetchJsonResponseWithTimeout } from "../utils/fetchHelpers";
import { getConfiguredInstitutionId } from "../config/institution";
import { ApiErrorException } from "./errors";
import { withRetry } from "./retry";

/** Delegates request, retry, validation, and institution checks, then unwraps the response payload. */
export async function getJson<T>(
  path: string,
  parse?: (data: unknown) => T,
  options?: { signal?: AbortSignal }
): Promise<T> {
  const result = await getJsonResult(path, parse, options);
  return result.data;
}

export type ApiJsonResult<T> = {
  data: T;
  institutionId: string | null;
};

/** Converts HTTP-shaped transport failures to the API exception used by retry and UI layers. */
function toApiErrorException(error: unknown): ApiErrorException | undefined {
  if (
    typeof error !== "object" ||
    error === null ||
    !("status" in error) ||
    typeof (error as Record<string, unknown>).status !== "number"
  ) {
    return undefined;
  }

  const details = error as Record<string, unknown>;
  return new ApiErrorException({
    status: details.status as number,
    code: typeof details.code === "string" ? details.code : "unknown_error",
    message: error instanceof Error ? error.message : "Request failed"
  });
}

/** Checks that a response belongs to the configured institution before exposing its data. */
function getResponseInstitutionId(response: { headers: Headers }): string | null {
  const institutionId = response.headers.get("x-institution-id");
  const configuredInstitutionId = getConfiguredInstitutionId();
  const institutionHeaderMustMatch = institutionId !== null || !isDevelopmentBffEnvironment();
  if (institutionHeaderMustMatch && institutionId !== configuredInstitutionId) {
    throw new ApiErrorException({
      status: 409,
      code: "institution_mismatch",
      message: "App and data service institution IDs do not match"
    });
  }

  return institutionId;
}

/** Resolves only paths that remain within the previously validated BFF origin. */
function createBffRequestUrl(path: string): string {
  const baseUrl = new URL(getBffBaseUrl());
  const requestUrl = new URL(path, baseUrl);
  if (requestUrl.origin !== baseUrl.origin) {
    throw new Error("BFF request path must remain within the configured origin");
  }
  return requestUrl.toString();
}

/** Wraps the parsed payload with response metadata needed by callers. */
export async function getJsonResult<T>(
  path: string,
  parse?: (data: unknown) => T,
  options?: { signal?: AbortSignal }
): Promise<ApiJsonResult<T>> {
  const url = createBffRequestUrl(path);
  const response = await withRetry(
    () => fetchJsonResponseWithTimeout<unknown>(url, { signal: options?.signal })
      .catch((error: unknown) => {
        throw toApiErrorException(error) ?? error;
      }),
    { signal: options?.signal }
  );
  const institutionId = getResponseInstitutionId(response);

  return {
    data: parse ? parse(response.data) : (response.data as T),
    institutionId
  };
}
