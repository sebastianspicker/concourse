import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchWithTimeout, TimeoutError } from "../fetch";

describe("fetchWithTimeout — timeout behavior", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("completes successfully within timeout", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("ok", { status: 200 })
    );

    const response = await fetchWithTimeout("https://example.com", undefined, 10_000);
    expect(response.status).toBe(200);
  });

  it("throws TimeoutError when fetch exceeds timeout", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          // Listen for abort on the signal passed to fetch
          const signal = (init as RequestInit | undefined)?.signal;
          signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        })
    );

    await expect(fetchWithTimeout("https://slow.example.com", undefined, 50)).rejects.toThrow(
      TimeoutError
    );
  });

  it("TimeoutError has correct name property", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          const signal = (init as RequestInit | undefined)?.signal;
          signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        })
    );

    try {
      await fetchWithTimeout("https://slow.example.com", undefined, 50);
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TimeoutError);
      expect((err as TimeoutError).name).toBe("TimeoutError");
    }
  });

  it("caller-provided AbortSignal still works", async () => {
    const callerController = new AbortController();
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          const signal = (init as RequestInit | undefined)?.signal;
          signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        })
    );

    // Abort via caller signal, not timeout
    setTimeout(() => callerController.abort(), 10);

    // Use a long timeout so the caller abort fires first
    await expect(
      fetchWithTimeout("https://example.com", { signal: callerController.signal }, 30_000)
    ).rejects.toThrow();
  });

  it("clears timeout on success (no dangling timers)", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("ok", { status: 200 })
    );

    await fetchWithTimeout("https://example.com", undefined, 10_000);
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("uses 10_000ms as default timeout", async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("ok", { status: 200 })
    );

    await fetchWithTimeout("https://example.com");
    // Find the setTimeout call for the timeout (with a numeric ms arg)
    const timeoutCall = setTimeoutSpy.mock.calls.find(
      (call) => typeof call[1] === "number" && call[1] === 10_000
    );
    expect(timeoutCall).toBeDefined();
  });
});
