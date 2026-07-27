/** Verifies request deadlines, cancellation, malformed bodies, and BFF error fallback parsing. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchJsonWithTimeout, RequestTimeoutError } from "../fetchHelpers";
import { toUiError } from "../../api/uiError";

type FetchArgs = Parameters<typeof fetch>;

function startAbortableRequest(external: AbortController) {
  return fetchJsonWithTimeout("https://example.com", { signal: external.signal }, 50);
}

describe("fetchJsonWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aborts on timeout even when a caller signal is provided", async () => {
    const fetchMock = vi.fn(((_url: FetchArgs[0], init?: FetchArgs[1]) => {
      const signal = init?.signal as AbortSignal | undefined;
      return new Promise((_, reject) => {
        if (signal?.aborted) {
          const err = new Error("Aborted");
          (err as { name?: string }).name = "AbortError";
          reject(err);
          return;
        }
        signal?.addEventListener(
          "abort",
          () => {
            const err = new Error("Aborted");
            (err as { name?: string }).name = "AbortError";
            reject(err);
          },
          { once: true }
        );
      });
    }) as unknown as typeof fetch);

    vi.stubGlobal("fetch", fetchMock);

    const external = new AbortController();
    const promise = startAbortableRequest(external);
    const assertion = expect(promise).rejects.toBeInstanceOf(RequestTimeoutError);

    await vi.advanceTimersByTimeAsync(60);

    await assertion;
    expect(external.signal.aborted).toBe(false);
  });

  it("preserves a caller cancellation as an ignored AbortError", async () => {
    const fetchMock = vi.fn(((_url: FetchArgs[0], init?: FetchArgs[1]) => new Promise((_, reject) => {
      init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("Aborted"), { name: "AbortError" })), { once: true });
    })) as unknown as typeof fetch);
    vi.stubGlobal("fetch", fetchMock);
    const external = new AbortController();
    const promise = startAbortableRequest(external);
    external.abort();

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(toUiError(Object.assign(new Error("Aborted"), { name: "AbortError" }))).toBeNull();
    expect(toUiError(new RequestTimeoutError())).toMatchObject({ kind: "timeout" });
  });

  it("keeps the timeout classification while reading a stalled response body", async () => {
    const body = new ReadableStream<Uint8Array>({
      pull: () => new Promise<void>(() => undefined),
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body)));

    const promise = fetchJsonWithTimeout("https://example.com", undefined, 50);
    const assertion = expect(promise).rejects.toBeInstanceOf(RequestTimeoutError);
    await vi.advanceTimersByTimeAsync(60);

    await assertion;
  });

  it("rejects non-http BFF URLs before fetch", async () => {
    const fetchMock = vi.fn() as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJsonWithTimeout("file:///tmp/data.json")).rejects.toThrow(
      "BFF URL must use http or https"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects BFF URLs with credentials before fetch", async () => {
    const fetchMock = vi.fn() as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJsonWithTimeout("https://user:pass@example.com")).rejects.toThrow(
      "BFF URL must not include credentials"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
