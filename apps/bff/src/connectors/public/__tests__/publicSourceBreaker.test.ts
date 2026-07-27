/** Verifies circuit breakers are isolated and reused per public source. */

import { describe, expect, it } from "vitest";

import { CircuitOpenError } from "../../../utils/circuitBreaker";
import { createPublicSourceBreakerRegistry } from "../publicSourceBreaker";

async function failFiveTimes(breaker: ReturnType<ReturnType<typeof createPublicSourceBreakerRegistry>>): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await expect(breaker.call(async () => { throw new Error("upstream failed"); })).rejects.toThrow("upstream failed");
  }
}

describe("public source breaker registry", () => {
  it("reuses a source breaker within a namespace and isolates namespaces", async () => {
    const getBreaker = createPublicSourceBreakerRegistry();
    const events = getBreaker("public-events", "https://public.example/feed");
    const sameEvents = getBreaker("public-events", "https://public.example/feed");
    const schedule = getBreaker("public-schedule", "https://public.example/feed");

    expect(sameEvents).toBe(events);
    expect(schedule).not.toBe(events);

    await failFiveTimes(events);
    await expect(events.call(async () => "unexpected")).rejects.toBeInstanceOf(CircuitOpenError);
    await expect(schedule.call(async () => "available")).resolves.toBe("available");
  });
});
