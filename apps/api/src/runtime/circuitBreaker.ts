/** Implements a small circuit breaker for unreliable upstream operations. */

type CircuitState = "closed" | "open" | "half_open";

interface CircuitBreakerState {
  currentState: CircuitState;
  consecutiveFailures: number;
  openedAt: number;
  stateVersion: number;
}

export interface CircuitBreakerConfig {
  readonly name: string;
  readonly failureThreshold: number;
  readonly cooldownMs: number;
}

/** Signals that an upstream call was skipped while its circuit breaker is open. */
export class CircuitOpenError extends Error {
  /** Captures the breaker name so logs identify the unavailable upstream source. */
  constructor(circuitName: string) {
    super(`Circuit breaker "${circuitName}" is open: request rejected`);
    this.name = "CircuitOpenError";
  }
}

export interface CircuitBreaker {
  call<T>(fn: () => Promise<T>): Promise<T>;
  state(): CircuitState;
}

/** Opens the breaker and starts its cooldown after the failure threshold is reached. */
function transitionToOpen(state: CircuitBreakerState): void {
  state.currentState = "open";
  state.openedAt = Date.now();
  state.stateVersion += 1;
}

/** Closes the breaker and resets failure counters after a successful probe. */
function transitionToClosed(state: CircuitBreakerState): void {
  state.currentState = "closed";
  state.consecutiveFailures = 0;
  state.stateVersion += 1;
}

/** Permits one half-open probe only after cooldown and while no probe is active. */
function shouldAttemptProbe(state: CircuitBreakerState, config: CircuitBreakerConfig): boolean {
  return state.currentState === "open" && Date.now() - state.openedAt >= config.cooldownMs;
}

/** Starts a normal call or exclusive half-open probe and records its state version. */
function beginCall(state: CircuitBreakerState, config: CircuitBreakerConfig): { isProbe: boolean; callVersion: number } {
  let isProbe = false;
  if (state.currentState === "open") {
    if (shouldAttemptProbe(state, config)) {
      state.currentState = "half_open";
      state.stateVersion += 1;
      isProbe = true;
    } else {
      throw new CircuitOpenError(config.name);
    }
  }
  if (!isProbe && state.currentState === "half_open") throw new CircuitOpenError(config.name);
  return { isProbe, callVersion: state.stateVersion };
}

/** Resets a successful current call and closes the breaker when it was a probe. */
function handleSuccess(state: CircuitBreakerState, isProbe: boolean, callVersion: number): void {
  if (state.stateVersion !== callVersion) return;
  if (isProbe) {
    transitionToClosed(state);
  } else {
    state.consecutiveFailures = 0;
  }
}

/** Opens the breaker only for the current call after its failure threshold is reached. */
function handleFailure(
  state: CircuitBreakerState,
  config: CircuitBreakerConfig,
  isProbe: boolean,
  callVersion: number
): void {
  if (state.stateVersion !== callVersion) return;
  state.consecutiveFailures += 1;
  if (isProbe || state.consecutiveFailures >= config.failureThreshold) transitionToOpen(state);
}

/** Runs one protected operation and commits its outcome only if its state version remains current. */
async function executeCircuitCall<T>(
  state: CircuitBreakerState,
  config: CircuitBreakerConfig,
  fn: () => Promise<T>
): Promise<T> {
  const { isProbe, callVersion } = beginCall(state, config);
  try {
    const result = await fn();
    handleSuccess(state, isProbe, callVersion);
    return result;
  } catch (err: unknown) {
    handleFailure(state, config, isProbe, callVersion);
    throw err;
  }
}

/** Creates a breaker that fast-fails after repeated failures until cooldown permits a probe. */
export function createCircuitBreaker(config: CircuitBreakerConfig): CircuitBreaker {
  const circuitState: CircuitBreakerState = {
    currentState: "closed",
    consecutiveFailures: 0,
    openedAt: 0,
    stateVersion: 0
  };

  return {
    call: (fn) => executeCircuitCall(circuitState, config, fn),
    state: () => circuitState.currentState
  };
}
