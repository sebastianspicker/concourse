/** Owns abortable fetch state and guards against late responses after refresh or unmount. */
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { ResourceLoadResult } from "../data/publicApiRequest";
import { toUiError, type UiError } from "../api/uiError";

export type PublicResource<T> = {
  data: T | null;
  error: UiError | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  source: ResourceLoadResult<T>["source"] | null;
  updatedAt: number | null;
  cacheAge: number | null;
};

/** Accepts a completion only when its controller still owns the mounted hook instance. */
function isCurrentRequest(
  mountedRef: RefObject<boolean>,
  controllerRef: RefObject<AbortController | null>,
  controller: AbortController
): boolean {
  return mountedRef.current === true && controllerRef.current === controller;
}

/**
 * Manages an abortable public-resource request without letting late responses overwrite
 * newer navigation or refresh state.
 */
export function usePublicResource<T>(
  loader: (options: { force?: boolean; signal?: AbortSignal }) => Promise<ResourceLoadResult<T>>,
  /** Serialized dependency key. When this changes, the hook re-fetches. */
  key?: string
): PublicResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<UiError | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [source, setSource] = useState<ResourceLoadResult<T>["source"] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [cacheAge, setCacheAge] = useState<number | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const dataRef = useRef<T | null>(null);
  const mountedRef = useRef<boolean>(false);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  /** Aborts the superseded request and returns the controller-bound load promise for this ownership epoch. */
  const startLoad = useCallback((force: boolean) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const promise = (async () => {
      try {
        const result = await loaderRef.current({ force, signal: controller.signal });
        if (!isCurrentRequest(mountedRef, controllerRef, controller)) return;
        dataRef.current = result.data;
        setData(result.data);
        setSource(result.source);
        setUpdatedAt(result.updatedAt);
        setCacheAge(result.cacheAge);
        setError(null);
      } catch (err: unknown) {
        if (!isCurrentRequest(mountedRef, controllerRef, controller)) return;
        const uiError = toUiError(err);
        if (uiError !== null) setError(uiError);
      }
    })();
    return { controller, promise };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const hasExistingData = dataRef.current !== null;
    // Keep fulfilled rows mounted while a search-key change fetches their replacement.
    setLoading(!hasExistingData);
    setRefreshing(hasExistingData);
    setError(null);

    const { controller, promise } = startLoad(false);
    promise
      .catch(() => undefined)
      .finally(() => {
        if (mountedRef.current && controllerRef.current === controller) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [startLoad, key]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    // A refresh owns the active request, including one started by the initial load.
    setLoading(false);
    const { controller, promise } = startLoad(true);
    try {
      await promise;
    } finally {
      if (isCurrentRequest(mountedRef, controllerRef, controller)) setRefreshing(false);
    }
  }, [startLoad]);

  return { data, error, loading, refreshing, refresh, source, updatedAt, cacheAge };
}
