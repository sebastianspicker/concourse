/** Owns abortable fetch state and guards against late responses after refresh or unmount. */
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type RequestController = {
  controller: AbortController;
  promise: Promise<void>;
};

/** Accepts a completion only when its controller still owns the mounted hook instance. */
function isCurrentRequest(
  mountedRef: RefObject<boolean>,
  controllerRef: RefObject<AbortController | null>,
  controller: AbortController
): boolean {
  return mountedRef.current === true && controllerRef.current === controller;
}

/** Holds resource values and the transitions that are independent of request ownership. */
function useResourceState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<UiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [source, setSource] = useState<ResourceLoadResult<T>["source"] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const dataRef = useRef<T | null>(null);

  const beginKeyLoad = useCallback(() => {
    const hasExistingData = dataRef.current !== null;
    setLoading(!hasExistingData);
    setRefreshing(hasExistingData);
    setError(null);
  }, []);
  const beginRefresh = useCallback(() => {
    setRefreshing(true);
    setLoading(false);
  }, []);
  const acceptResult = useCallback((result: ResourceLoadResult<T>) => {
    dataRef.current = result.data;
    setData(result.data);
    setSource(result.source);
    setUpdatedAt(result.updatedAt);
    setCacheAge(result.cacheAge);
    setError(null);
  }, []);
  const acceptError = useCallback((error: unknown) => {
    const uiError = toUiError(error);
    if (uiError !== null) setError(uiError);
  }, []);
  const finishKeyLoad = useCallback(() => {
    setLoading(false);
    setRefreshing(false);
  }, []);

  const operations = useMemo(() => ({
    beginKeyLoad,
    beginRefresh,
    acceptResult,
    acceptError,
    finishKeyLoad,
  }), [acceptError, acceptResult, beginKeyLoad, beginRefresh, finishKeyLoad]);
  return { resource: { data, error, loading, refreshing, source, updatedAt, cacheAge }, operations };
}

/** Owns the active controller and routes only its mounted completion into resource state. */
function useRequestOwner<T>(
  loader: (options: { force?: boolean; signal?: AbortSignal }) => Promise<ResourceLoadResult<T>>,
  acceptResult: (result: ResourceLoadResult<T>) => void,
  acceptError: (error: unknown) => void
) {
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const owns = useCallback(
    (controller: AbortController) => isCurrentRequest(mountedRef, controllerRef, controller),
    []
  );
  const startLoad = useCallback((force: boolean): RequestController => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    let load: Promise<ResourceLoadResult<T>>;
    try {
      load = loaderRef.current({ force, signal: controller.signal });
    } catch (error: unknown) {
      load = Promise.reject(error);
    }
    const promise = load
      .then((result) => {
        if (owns(controller)) acceptResult(result);
      })
      .catch((error: unknown) => {
        if (owns(controller)) acceptError(error);
      });
    return { controller, promise };
  }, [acceptError, acceptResult, owns]);
  const mount = useCallback(() => { mountedRef.current = true; }, []);
  const unmount = useCallback(() => {
    mountedRef.current = false;
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  return useMemo(() => ({ owns, startLoad, mount, unmount }), [mount, owns, startLoad, unmount]);
}

/** Runs key-driven loads, retaining fulfilled data while the replacement request is pending. */
function useKeyLoad<T>(
  key: string | undefined,
  operations: ReturnType<typeof useResourceState<T>>["operations"],
  owner: ReturnType<typeof useRequestOwner<T>>
): void {
  useEffect(() => {
    owner.mount();
    operations.beginKeyLoad();
    const { controller, promise } = owner.startLoad(false);
    void promise.finally(() => {
      if (owner.owns(controller)) operations.finishKeyLoad();
    });
    return owner.unmount;
  }, [key, operations, owner]);
}

/** Starts a force refresh that takes ownership from any existing key-driven request. */
function useRefresh<T>(
  operations: ReturnType<typeof useResourceState<T>>["operations"],
  owner: ReturnType<typeof useRequestOwner<T>>
): () => Promise<void> {
  return useCallback(async () => {
    operations.beginRefresh();
    const { controller, promise } = owner.startLoad(true);
    try {
      await promise;
    } finally {
      if (owner.owns(controller)) operations.finishKeyLoad();
    }
  }, [operations, owner]);
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
  const { resource, operations } = useResourceState<T>();
  const owner = useRequestOwner(loader, operations.acceptResult, operations.acceptError);
  useKeyLoad(key, operations, owner);
  const refresh = useRefresh(operations, owner);
  return { ...resource, refresh };
}
