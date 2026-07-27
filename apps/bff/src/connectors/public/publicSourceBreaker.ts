/** Maintains isolated circuit breakers for each public upstream source. */

import { createCircuitBreaker, type CircuitBreaker } from "../../utils/circuitBreaker";

const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 30_000;

/** Returns source-scoped breakers so one upstream outage does not affect another. */
export function createPublicSourceBreakerRegistry() {
  const breakers = new Map<string, CircuitBreaker>();

  return (namespace: string, sourceUrl: string): CircuitBreaker => {
    const key = `${namespace}:${sourceUrl}`;
    const existing = breakers.get(key);
    if (existing) return existing;

    const breaker = createCircuitBreaker({
      name: key,
      failureThreshold: FAILURE_THRESHOLD,
      cooldownMs: COOLDOWN_MS,
    });
    breakers.set(key, breaker);
    return breaker;
  };
}

export const getPublicSourceBreaker = createPublicSourceBreakerRegistry();
