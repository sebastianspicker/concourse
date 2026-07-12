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

function isCurrentRequest(
  mountedRef: RefObject<boolean>,
  controllerRef: RefObject<AbortController | null>,
  controller: AbortController
): boolean {
  return mountedRef.current === true && controllerRef.current === controller;
}

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
  const mountedRef = useRef<boolean>(false);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const runLoad = useCallback(async (force: boolean) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const result = await loaderRef.current({ force, signal: controller.signal });
      if (!isCurrentRequest(mountedRef, controllerRef, controller)) return;
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
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);

    const loadPromise = runLoad(false);
    // Capture the controller that runLoad just created (set synchronously on its first line)
    const controller = controllerRef.current;
    loadPromise
      .catch(() => undefined)
      .finally(() => {
        if (mountedRef.current && controllerRef.current === controller) setLoading(false);
      });

    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
    // Re-run when `key` changes (e.g. filter parameters changed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runLoad, key]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await runLoad(true);
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [runLoad]);

  return { data, error, loading, refreshing, refresh, source, updatedAt, cacheAge };
}
