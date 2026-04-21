import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchJsonWithTimeout } from "../fetchHelpers";

type FetchArgs = Parameters<typeof fetch>;

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
    const promise = fetchJsonWithTimeout(
      "https://example.com",
      { signal: external.signal },
      50
    );
    const assertion = expect(promise).rejects.toMatchObject({ name: "AbortError" });

    await vi.advanceTimersByTimeAsync(60);

    await assertion;
    expect(external.signal.aborted).toBe(false);
  });
});
