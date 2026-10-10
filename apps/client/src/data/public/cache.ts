import { createAbortError } from "@/platform/http/errors";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type CoordinatedLoad = {
  controller: AbortController;
  consumers: Set<symbol>;
  promise: Promise<unknown>;
};

export type CachedValue<T> = {
  value: T;
  fromCache: boolean;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, CoordinatedLoad>();
const MAX_CACHE_ENTRIES = 50;
const DEFAULT_LOADER_TIMEOUT_MS = 15_000;

function evictIfNeeded(): void {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  const keys = cache.keys();
  while (cache.size > MAX_CACHE_ENTRIES) {
    const key = keys.next().value;
    if (key === undefined) break;
    cache.delete(key);
  }
}

function runCoordinatedLoader<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>,
  ttlMs: number,
): CoordinatedLoad {
  const controller = new AbortController();
  const coordinated: CoordinatedLoad = {
    controller,
    consumers: new Set(),
    promise: Promise.resolve(),
  };
  let timeout: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error("Cache loader timeout"));
    }, DEFAULT_LOADER_TIMEOUT_MS);
  });

  let loaded: Promise<T>;
  try {
    loaded = Promise.resolve(loader(controller.signal));
  } catch (error: unknown) {
    loaded = Promise.reject(error);
  }
  coordinated.promise = Promise.race([loaded, deadline])
    .then((value) => {
      if (controller.signal.aborted) throw createAbortError();
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      evictIfNeeded();
      return value;
    })
    .finally(() => {
      clearTimeout(timeout);
      if (inFlight.get(key) === coordinated) inFlight.delete(key);
    });
  void coordinated.promise.catch(() => undefined);
  inFlight.set(key, coordinated);
  return coordinated;
}

function attachConsumer<T>(load: CoordinatedLoad, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) return Promise.reject(createAbortError());

  const consumer = Symbol("cache-consumer");
  load.consumers.add(consumer);

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const detach = (cancelled: boolean) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      load.consumers.delete(consumer);
      if (cancelled && load.consumers.size === 0) load.controller.abort();
    };
    const onAbort = () => {
      detach(true);
      reject(createAbortError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) {
      onAbort();
      return;
    }

    load.promise.then(
      (value) => {
        if (settled) return;
        detach(false);
        resolve(value as T);
      },
      (error: unknown) => {
        if (settled) return;
        detach(false);
        reject(error);
      },
    );
  });
}

/** Returns a fresh memory value or joins one coordinated loader for the key. */
export async function getCachedWithMetadata<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>,
  ttlMs: number,
  force = false,
  signal?: AbortSignal,
): Promise<CachedValue<T>> {
  if (signal?.aborted) throw createAbortError();
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!force && entry && entry.expiresAt > Date.now()) {
    return { value: entry.value, fromCache: true };
  }

  let coordinated = inFlight.get(key);
  if (coordinated?.controller.signal.aborted) {
    if (inFlight.get(key) === coordinated) inFlight.delete(key);
    coordinated = undefined;
  }
  coordinated ??= runCoordinatedLoader(key, loader, ttlMs);
  return { value: await attachConsumer<T>(coordinated, signal), fromCache: false };
}

/** Compatibility wrapper for callers that only need the cached value. */
export async function getCached<T>(
  key: string,
  loader: ((signal: AbortSignal) => Promise<T>) | (() => Promise<T>),
  ttlMs: number,
  force = false,
  signal?: AbortSignal,
): Promise<T> {
  return (await getCachedWithMetadata(key, loader, ttlMs, force, signal)).value;
}

/** Clears memory and aborts the shared transport for every affected key. */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
    inFlight.get(key)?.controller.abort();
    inFlight.delete(key);
    return;
  }

  cache.clear();
  for (const load of inFlight.values()) load.controller.abort();
  inFlight.clear();
}
