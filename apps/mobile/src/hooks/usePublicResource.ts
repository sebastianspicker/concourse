import { useCallback, useEffect, useRef, useState } from "react";

type PublicResource<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
};

export function usePublicResource<T>(
  loader: (options: { force?: boolean; signal?: AbortSignal }) => Promise<T>,
  /** Serialized dependency key. When this changes, the hook re-fetches. */
  key?: string
): PublicResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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
      if (!mountedRef.current || controllerRef.current !== controller) return;
      setData(result);
      setError(null);
    } catch (err: unknown) {
      if (!mountedRef.current || controllerRef.current !== controller) return;
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
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

  return { data, error, loading, refreshing, refresh };
}
