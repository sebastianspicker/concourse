/** Minimal abort-signal surface shared by browser and Node request helpers. */
export type AbortSignalLike = {
  readonly aborted: boolean;
  addEventListener: (type: "abort", listener: () => void, options?: { once?: boolean }) => void;
  removeEventListener: (type: "abort", listener: () => void) => void;
};

/** Races pending work against cancellation and always detaches its listener. */
export function raceWithAbort<T>(
  promise: Promise<T>,
  signal: AbortSignalLike,
  createAbortError: () => Error
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    const finish = (complete: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      complete();
    };
    const onAbort = () => {
      finish(() => reject(createAbortError()));
    };
    promise.then(
      (value) => finish(() => resolve(value)),
      (error: unknown) => finish(() => reject(error))
    );
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
}
