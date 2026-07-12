import { getBffBaseUrl } from "../utils/env";
import { fetchJsonResponseWithTimeout } from "../utils/fetchHelpers";
import { getConfiguredInstitutionId } from "../config/institution";
import { ApiErrorException } from "./errors";
import { withRetry } from "./retry";

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

export async function getJsonResult<T>(
  path: string,
  parse?: (data: unknown) => T,
  options?: { signal?: AbortSignal }
): Promise<ApiJsonResult<T>> {
  const url = `${getBffBaseUrl()}${path}`;
  const response = await withRetry(async () => {
    try {
      return await fetchJsonResponseWithTimeout<unknown>(url, { signal: options?.signal });
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        typeof (err as Record<string, unknown>).status === "number"
      ) {
        const status = (err as Record<string, unknown>).status as number;
        const code = typeof (err as Record<string, unknown>).code === "string"
          ? (err as Record<string, unknown>).code as string
          : "unknown_error";
        throw new ApiErrorException({
          status,
          code,
          message: err instanceof Error ? err.message : "Request failed"
        });
      }
      throw err;
    }
  }, { signal: options?.signal });

  const institutionId = response.headers.get("x-institution-id");
  const expectedInstitutionId = getConfiguredInstitutionId();
  if (institutionId !== null && institutionId !== expectedInstitutionId) {
    throw new ApiErrorException({
      status: 409,
      code: "institution_mismatch",
      message: "App and data service institution IDs do not match"
    });
  }

  return {
    data: parse ? parse(response.data) : (response.data as T),
    institutionId
  };
}
