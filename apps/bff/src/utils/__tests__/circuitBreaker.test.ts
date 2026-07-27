/** Verifies circuit-breaker failure, cooldown, and recovery transitions. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCircuitBreaker, CircuitOpenError } from "../circuitBreaker";

type Breaker = ReturnType<typeof createCircuitBreaker>;

function createTestBreaker(
  overrides: Partial<Parameters<typeof createCircuitBreaker>[0]> = {},
) {
  return createCircuitBreaker({
    name: "test",
    failureThreshold: 2,
    cooldownMs: 30_000,
    ...overrides,
  });
}

async function fail(breaker: Breaker, message = "fail") {
  await expect(
    breaker.call(() => Promise.reject(new Error(message))),
  ).rejects.toThrow(message);
}

async function trip(breaker: Breaker, failures = 2) {
  for (let index = 0; index < failures; index += 1) {
    await fail(breaker);
  }
  expect(breaker.state()).toBe("open");
}

describe("CircuitBreaker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("CLOSED: stays CLOSED on success", async () => {
    const breaker = createTestBreaker({ failureThreshold: 5 });

    const result = await breaker.call(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
    expect(breaker.state()).toBe("closed");
  });

  it("CLOSED → OPEN after failureThreshold consecutive failures", async () => {
    const breaker = createTestBreaker({ failureThreshold: 3 });

    await trip(breaker, 3);
  });

  it("OPEN: rejects immediately with CircuitOpenError", async () => {
    const breaker = createTestBreaker();

    await trip(breaker);
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(breaker.call(fn)).rejects.toThrow(CircuitOpenError);
    expect(fn).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "OPEN → HALF_OPEN after cooldown expires",
      probe: () => Promise.resolve("recovered"),
      assertResult: (result: string) => expect(result).toBe("recovered"),
      state: "closed",
    },
    {
      name: "HALF_OPEN → CLOSED on success",
      probe: () => Promise.resolve("ok"),
      assertResult: () => undefined,
      state: "closed",
    },
    {
      name: "HALF_OPEN → OPEN on failure",
      probe: () => Promise.reject(new Error("still failing")),
      assertResult: () => undefined,
      state: "open",
    },
  ])("$name", async ({ probe, assertResult, state }) => {
    const breaker = createTestBreaker({ cooldownMs: 5_000 });

    await trip(breaker);
    vi.advanceTimersByTime(5_001);

    if (state === "open") {
      await expect(breaker.call(probe)).rejects.toThrow("still failing");
    } else {
      assertResult(await breaker.call(probe));
    }
    expect(breaker.state()).toBe(state);
  });

  it("admits exactly one half-open probe", async () => {
    const breaker = createTestBreaker({ failureThreshold: 1, cooldownMs: 5_000 });
    await trip(breaker, 1);
    vi.advanceTimersByTime(5_001);
    let release!: () => void;
    const probe = breaker.call(
      () => new Promise<string>((resolve) => { release = () => resolve("ok"); }),
    );
    await expect(breaker.call(() => Promise.resolve("must not run"))).rejects.toThrow(CircuitOpenError);
    release();
    await expect(probe).resolves.toBe("ok");
    expect(breaker.state()).toBe("closed");
  });

  it("success resets failure counter", async () => {
    const breaker = createTestBreaker({ failureThreshold: 3 });

    await fail(breaker);
    await fail(breaker);
    await breaker.call(() => Promise.resolve("ok"));
    await fail(breaker);
    await fail(breaker);
    expect(breaker.state()).toBe("closed");
  });

  it("non-consecutive failures don't trip the breaker", async () => {
    const breaker = createTestBreaker({ failureThreshold: 3 });

    for (let index = 0; index < 3; index += 1) {
      await fail(breaker);
      await breaker.call(() => Promise.resolve("ok"));
    }
    expect(breaker.state()).toBe("closed");
  });

  it("CircuitOpenError has correct name and circuit name", async () => {
    const breaker = createTestBreaker({ name: "my-service", failureThreshold: 1 });

    await trip(breaker, 1);
    await expect(breaker.call(() => Promise.resolve("ok"))).rejects.toMatchObject({
      name: "CircuitOpenError",
      message: expect.stringContaining("my-service"),
    });
  });
});
