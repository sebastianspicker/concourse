/** Attaches replacement ownership before cancelling the previous consumer. */
export function replaceRequestController<T>(
  controllerRef: { current: AbortController | null },
  start: (signal: AbortSignal) => Promise<T>,
): { controller: AbortController; load: Promise<T> } {
  const previous = controllerRef.current;
  const controller = new AbortController();
  controllerRef.current = controller;
  let load: Promise<T>;
  try {
    load = Promise.resolve(start(controller.signal));
  } catch (error: unknown) {
    load = Promise.reject(error);
  }
  previous?.abort();
  return { controller, load };
}

/** Orders overlapping async snapshots and prevents updates after the owning hook unmounts. */
export function createLatestResultGuard() {
  let latestRequest = 0;
  let mounted = true;
  return {
    begin: () => {
      latestRequest += 1;
      return latestRequest;
    },
    accepts: (request: number) => mounted && request === latestRequest,
    mount: () => {
      mounted = true;
      latestRequest += 1;
    },
    unmount: () => { mounted = false; },
  };
}
