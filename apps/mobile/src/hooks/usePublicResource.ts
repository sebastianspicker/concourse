import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

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
    const controller = replaceController(controllerRef);
    try {
      await loadPublicResource(loaderRef, controller, controllerRef, force, mountedRef, setData, setError);
    } catch (err: unknown) {
      setLoadError(err, controller, controllerRef, mountedRef, setError);
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

function replaceController(ref: MutableRefObject<AbortController | null>): AbortController {
  ref.current?.abort();
  const controller = new AbortController();
  ref.current = controller;
  return controller;
}

async function loadPublicResource<T>(
  loader: MutableRefObject<(options: { force?: boolean; signal?: AbortSignal }) => Promise<T>>,
  controller: AbortController,
  controllerRef: MutableRefObject<AbortController | null>,
  force: boolean,
  mounted: MutableRefObject<boolean>,
  setData: Dispatch<SetStateAction<T | null>>,
  setError: Dispatch<SetStateAction<string | null>>
): Promise<void> {
  const result = await loader.current({ force, signal: controller.signal });
  if (!mounted.current || controllerRef.current !== controller) return;
  setData(result);
  setError(null);
}

function setLoadError(
  error: unknown,
  controller: AbortController,
  controllerRef: MutableRefObject<AbortController | null>,
  mounted: MutableRefObject<boolean>,
  setError: Dispatch<SetStateAction<string | null>>
): void {
  const isStale = !mounted.current || controllerRef.current !== controller;
  const wasAborted = error instanceof Error && error.name === "AbortError";
  if (isStale || wasAborted) return;
  setError(error instanceof Error ? error.message : "Unknown error");
}
