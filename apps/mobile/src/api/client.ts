import { getBffBaseUrl } from "../utils/env";
import { fetchJsonWithTimeout } from "../utils/fetchHelpers";
import { ApiErrorException } from "./errors";
import { withRetry } from "./retry";

export async function getJson<T>(
  path: string,
  parse?: (data: unknown) => T,
  options?: { signal?: AbortSignal }
): Promise<T> {
  const url = `${getBffBaseUrl()}${path}`;
  const data = await withRetry(async () => {
    try {
      return await fetchJsonWithTimeout<unknown>(url, { signal: options?.signal });
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
  });

  return parse ? parse(data) : (data as T);
}
