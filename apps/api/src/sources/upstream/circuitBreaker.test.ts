import { afterEach, describe, expect, it, vi } from "vitest";

import { CircuitOpenError, createCircuitBreaker } from "./circuitBreaker";

afterEach(() => vi.useRealTimers());

describe("createCircuitBreaker", () => {
  it("permits exactly one probe after the cooldown", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const breaker = createCircuitBreaker({ name: "source", failureThreshold: 1, cooldownMs: 1_000 });
    await expect(breaker.call(async () => { throw new Error("offline"); })).rejects.toThrow("offline");
    await expect(breaker.call(async () => "too early")).rejects.toBeInstanceOf(CircuitOpenError);

    vi.advanceTimersByTime(1_000);
    let resolveProbe: ((value: string) => void) | undefined;
    const probe = breaker.call(() => new Promise<string>((resolve) => { resolveProbe = resolve; }));
    await expect(breaker.call(async () => "parallel probe")).rejects.toBeInstanceOf(CircuitOpenError);
    resolveProbe?.("recovered");

    await expect(probe).resolves.toBe("recovered");
    expect(breaker.state()).toBe("closed");
  });

  it("ignores a stale completion after a concurrent failure changes state", async () => {
    vi.useFakeTimers();
    const breaker = createCircuitBreaker({ name: "source", failureThreshold: 1, cooldownMs: 1_000 });
    let resolveStale: ((value: string) => void) | undefined;
    const stale = breaker.call(() => new Promise<string>((resolve) => { resolveStale = resolve; }));
    await expect(breaker.call(async () => { throw new Error("new failure"); })).rejects.toThrow("new failure");
    expect(breaker.state()).toBe("open");

    resolveStale?.("late success");
    await expect(stale).resolves.toBe("late success");
    expect(breaker.state()).toBe("open");
    await expect(breaker.call(async () => "must remain blocked")).rejects.toBeInstanceOf(CircuitOpenError);
  });
});
