import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCircuitBreaker,
  CircuitOpenError,
} from "../circuitBreaker";

describe("CircuitBreaker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("CLOSED — stays CLOSED on success", async () => {
    const breaker = createCircuitBreaker({ name: "test", failureThreshold: 5, cooldownMs: 30_000 });

    const result = await breaker.call(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
    expect(breaker.state()).toBe("closed");
  });

  it("CLOSED → OPEN after failureThreshold consecutive failures", async () => {
    const breaker = createCircuitBreaker({ name: "test", failureThreshold: 3, cooldownMs: 30_000 });

    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line no-await-in-loop
      await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow("fail");
    }

    expect(breaker.state()).toBe("open");
  });

  it("OPEN — rejects immediately with CircuitOpenError", async () => {
    const breaker = createCircuitBreaker({ name: "test", failureThreshold: 2, cooldownMs: 30_000 });

    // Trip the breaker
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();

    expect(breaker.state()).toBe("open");

    // Should reject immediately without calling the function
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(breaker.call(fn)).rejects.toThrow(CircuitOpenError);
    expect(fn).not.toHaveBeenCalled();
  });

  it("OPEN → HALF_OPEN after cooldown expires", async () => {
    const breaker = createCircuitBreaker({ name: "test", failureThreshold: 2, cooldownMs: 5_000 });

    // Trip the breaker
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    expect(breaker.state()).toBe("open");

    // Advance past cooldown
    vi.advanceTimersByTime(5_001);

    // Next call should go through (half_open probe)
    const result = await breaker.call(() => Promise.resolve("recovered"));
    expect(result).toBe("recovered");
  });

  it("HALF_OPEN → CLOSED on success", async () => {
    const breaker = createCircuitBreaker({ name: "test", failureThreshold: 2, cooldownMs: 5_000 });

    // Trip the breaker
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    expect(breaker.state()).toBe("open");

    // Advance past cooldown
    vi.advanceTimersByTime(5_001);

    // Probe succeeds → closed
    await breaker.call(() => Promise.resolve("ok"));
    expect(breaker.state()).toBe("closed");
  });

  it("HALF_OPEN → OPEN on failure", async () => {
    const breaker = createCircuitBreaker({ name: "test", failureThreshold: 2, cooldownMs: 5_000 });

    // Trip the breaker
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    expect(breaker.state()).toBe("open");

    // Advance past cooldown
    vi.advanceTimersByTime(5_001);

    // Probe fails → back to open
    await expect(breaker.call(() => Promise.reject(new Error("still failing")))).rejects.toThrow();
    expect(breaker.state()).toBe("open");
  });

  it("success resets failure counter", async () => {
    const breaker = createCircuitBreaker({ name: "test", failureThreshold: 3, cooldownMs: 30_000 });

    // Two failures, then a success
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    await breaker.call(() => Promise.resolve("ok"));

    // Two more failures — should NOT trip (counter was reset)
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    expect(breaker.state()).toBe("closed");
  });

  it("non-consecutive failures don't trip the breaker", async () => {
    const breaker = createCircuitBreaker({ name: "test", failureThreshold: 3, cooldownMs: 30_000 });

    // Alternating success/failure
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    await breaker.call(() => Promise.resolve("ok"));
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();
    await breaker.call(() => Promise.resolve("ok"));
    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();

    // Still closed — failures were not consecutive
    expect(breaker.state()).toBe("closed");
  });

  it("CircuitOpenError has correct name and circuit name", async () => {
    const breaker = createCircuitBreaker({ name: "my-service", failureThreshold: 1, cooldownMs: 30_000 });

    await expect(breaker.call(() => Promise.reject(new Error("fail")))).rejects.toThrow();

    try {
      await breaker.call(() => Promise.resolve("ok"));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(CircuitOpenError);
      expect((err as CircuitOpenError).name).toBe("CircuitOpenError");
      expect((err as CircuitOpenError).message).toContain("my-service");
    }
  });
});
