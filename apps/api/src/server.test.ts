import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createServerLifecycle, installShutdownSignalHandlers } from "./server";

type CloseCallback = (error?: Error) => void;

function fakeServer() {
  let closeCallback: CloseCallback | undefined;
  return {
    server: {
      close: vi.fn((callback: CloseCallback) => { closeCallback = callback; }),
      closeAllConnections: vi.fn(),
      closeIdleConnections: vi.fn()
    },
    completeDrain: (error?: Error) => closeCallback?.(error)
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("server lifecycle", () => {
  it("drains once across repeated signals and cleans the cache after completion", async () => {
    vi.useFakeTimers();
    const { server, completeDrain } = fakeServer();
    const cleanup = vi.fn();
    const logger = vi.fn();
    const lifecycle = createServerLifecycle({ server, cleanup, logger });

    const sigint = lifecycle.shutdown("SIGINT");
    const sigterm = lifecycle.shutdown("SIGTERM");

    expect(sigterm).toBe(sigint);
    expect(server.close).toHaveBeenCalledOnce();
    expect(server.closeIdleConnections).toHaveBeenCalledOnce();
    expect(cleanup).not.toHaveBeenCalled();
    completeDrain();
    await Promise.all([sigint, sigterm]);

    expect(cleanup).toHaveBeenCalledOnce();
    expect(server.closeAllConnections).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("force-closes connections and cleans the cache exactly once at the deadline", async () => {
    vi.useFakeTimers();
    const { server, completeDrain } = fakeServer();
    const cleanup = vi.fn();
    const lifecycle = createServerLifecycle({ server, cleanup, logger: vi.fn(), shutdownTimeoutMs: 10_000 });

    const shutdown = lifecycle.shutdown("SIGTERM");
    await vi.advanceTimersByTimeAsync(10_000);
    await shutdown;

    expect(server.closeAllConnections).toHaveBeenCalledOnce();
    expect(cleanup).toHaveBeenCalledOnce();
    completeDrain();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("routes SIGINT and SIGTERM through the same lifecycle and detaches on completion", async () => {
    const signals = new EventEmitter();
    let resolveShutdown: (() => void) | undefined;
    const shutdown = vi.fn((_signal: "SIGINT" | "SIGTERM") => new Promise<void>((resolve) => { resolveShutdown = resolve; }));
    installShutdownSignalHandlers({ shutdown }, signals);

    signals.emit("SIGINT");
    signals.emit("SIGINT");
    signals.emit("SIGTERM");
    expect(shutdown).toHaveBeenCalledTimes(3);
    expect(shutdown.mock.calls.map(([signal]) => signal)).toEqual(["SIGINT", "SIGINT", "SIGTERM"]);

    resolveShutdown?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(signals.listenerCount("SIGINT")).toBe(0);
    expect(signals.listenerCount("SIGTERM")).toBe(0);
  });
});
