type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerConfig {
  readonly name: string;
  readonly failureThreshold: number;
  readonly cooldownMs: number;
}

export class CircuitOpenError extends Error {
  constructor(circuitName: string) {
    super(`Circuit breaker "${circuitName}" is open — request rejected`);
    this.name = "CircuitOpenError";
  }
}

export interface CircuitBreaker {
  call<T>(fn: () => Promise<T>): Promise<T>;
  state(): CircuitState;
}

export function createCircuitBreaker(config: CircuitBreakerConfig): CircuitBreaker {
  let currentState: CircuitState = "closed";
  let consecutiveFailures = 0;
  let openedAt = 0;

  function transitionToOpen(): void {
    currentState = "open";
    openedAt = Date.now();
  }

  function transitionToClosed(): void {
    currentState = "closed";
    consecutiveFailures = 0;
  }

  function shouldAttemptProbe(): boolean {
    return currentState === "open" && Date.now() - openedAt >= config.cooldownMs;
  }

  async function call<T>(fn: () => Promise<T>): Promise<T> {
    if (currentState === "open") {
      if (shouldAttemptProbe()) {
        currentState = "half_open";
      } else {
        throw new CircuitOpenError(config.name);
      }
    }

    try {
      const result = await fn();
      transitionToClosed();
      return result;
    } catch (err: unknown) {
      consecutiveFailures += 1;
      if (
        currentState === "half_open" ||
        consecutiveFailures >= config.failureThreshold
      ) {
        transitionToOpen();
      }
      throw err;
    }
  }

  return {
    call,
    state: () => currentState,
  };
}
