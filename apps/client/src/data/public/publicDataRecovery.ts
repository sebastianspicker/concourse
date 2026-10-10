export type PublicDataRecoveryReason = "reconnect" | "foreground";

export type PublicDataRecoveryState = {
  source: "network" | "memory-cache" | "persisted-cache" | null;
  updatedAt: number | null;
  transientFailure: boolean;
  recoveryBlocked: boolean;
};

type RecoveryRegistration = {
  getState: () => PublicDataRecoveryState;
  recover: () => void;
};

const RECOVERY_BURST_MS = 750;
const FOREGROUND_MAX_NETWORK_AGE_MS = 60_000;
const registrations = new Map<symbol, RecoveryRegistration>();
const pendingReasons = new Set<PublicDataRecoveryReason>();
let recoveryTimer: ReturnType<typeof setTimeout> | null = null;

function shouldRecover(state: PublicDataRecoveryState, reasons: ReadonlySet<PublicDataRecoveryReason>): boolean {
  if (state.recoveryBlocked) return false;
  if (state.source === "persisted-cache" || state.transientFailure) return true;
  return reasons.has("foreground") && (state.source === "network" || state.source === "memory-cache") && state.updatedAt !== null &&
    Date.now() - state.updatedAt > FOREGROUND_MAX_NETWORK_AGE_MS;
}

function runScheduledRecovery(): void {
  recoveryTimer = null;
  const reasons = new Set(pendingReasons);
  pendingReasons.clear();
  for (const registration of registrations.values()) {
    if (shouldRecover(registration.getState(), reasons)) registration.recover();
  }
}

/** Registers one mounted public resource with the shared recovery observer. */
export function registerPublicDataRecovery(registration: RecoveryRegistration): () => void {
  const id = Symbol("public-data-recovery");
  registrations.set(id, registration);
  return () => registrations.delete(id);
}

/** Coalesces reconnect, focus, and foreground bursts before evaluating mounted resources. */
export function schedulePublicDataRecovery(reason: PublicDataRecoveryReason): void {
  pendingReasons.add(reason);
  recoveryTimer ??= setTimeout(runScheduledRecovery, RECOVERY_BURST_MS);
}

/** Prevents a pending recovery burst from replacing data immediately after a user clear. */
export function cancelScheduledPublicDataRecovery(): void {
  if (recoveryTimer) clearTimeout(recoveryTimer);
  recoveryTimer = null;
  pendingReasons.clear();
}

/** Converts actual route changes into focus recovery without firing on mount or the same route. */
export function createRouteRecoveryObserver(schedule: () => void) {
  let previousPath: string | undefined;
  return (path: string) => {
    const changed = previousPath !== undefined && previousPath !== path;
    previousPath = path;
    if (changed) schedule();
  };
}
