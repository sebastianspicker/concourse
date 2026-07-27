/** Registers the shared lifecycle and behavior contracts for public resource hooks. */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { clearCache } from "../../data/cache";
import { clearPersistedCache } from "../../data/persistedCache";
import { jsonResponse } from "../../test/httpResponse";
import { _resetBffBaseUrlMemoForTests } from "../../utils/bffConfig";
import { renderHook, type RenderedHook } from "./testUtils";

type ObservableResource<T> = {
  data: T | null;
  error: unknown;
  loading: boolean;
};

type EdgeCaseContract<T> = {
  assertEmpty: (data: T | null) => void;
  emptyBody: T;
  emptyTestName: string;
  errorCode?: string;
  errorMessage?: string;
  errorStatus?: number;
  errorTestName: string;
  hook: () => ObservableResource<T>;
};

type SuccessCaseContract<T> = {
  assertLoaded: (data: T | null) => void;
  body: T;
  hook: () => ObservableResource<T>;
  testName: string;
};

/** Mounts a resource hook and verifies its initial loading state. */
function mountLoadingResource<T>(hook: () => ObservableResource<T>): RenderedHook<ObservableResource<T>> {
  const mounted = renderHook(hook);
  expect(mounted.getResult().loading).toBe(true);
  return mounted;
}

/** Flushes effects and returns the settled resource value after checking loading is complete. */
async function flushResource<T>(mounted: RenderedHook<ObservableResource<T>>): Promise<ObservableResource<T>> {
  await mounted.flush();
  const result = mounted.getResult();
  expect(result.loading).toBe(false);
  return result;
}

/** Registers isolated cache, environment, timer, and fetch state for a resource-hook suite. */
function defineResourceLifecycle(responseBody?: unknown): void {
  beforeEach(async () => {
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "http://localhost:4000";
    _resetBffBaseUrlMemoForTests();
    if (responseBody !== undefined) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(responseBody)));
    }
    clearCache();
    await clearPersistedCache();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_BFF_BASE_URL;
    await clearPersistedCache();
  });
}

/** Registers the shared successful-load contract for a resource hook. */
export function defineResourceSuccessCase<T>({
  assertLoaded,
  body,
  hook,
  testName,
}: SuccessCaseContract<T>): void {
  defineResourceLifecycle(body);
  it(testName, async () => {
    const mounted = mountLoadingResource(hook);
    const result = await flushResource(mounted);
    assertLoaded(result.data);
    mounted.unmount();
  });
}

/** Registers the transport-failure behavior shared by public resource hooks. */
function defineNetworkFailureCase<T>(hook: () => ObservableResource<T>): void {
  it("returns error state on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    const mounted = mountLoadingResource(hook);
    const result = await flushResource(mounted);
    expect(result.error).toBeTruthy();
    expect(result.data).toBeNull();
    mounted.unmount();
  });
}

/** Registers the empty-payload behavior while preserving each resource’s shape assertion. */
function defineEmptyResponseCase<T>(contract: EdgeCaseContract<T>): void {
  it(contract.emptyTestName, async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(contract.emptyBody)));
    const mounted = renderHook(contract.hook);
    const result = await flushResource(mounted);
    contract.assertEmpty(result.data);
    expect(result.error).toBeNull();
    mounted.unmount();
  });
}

/** Registers cancellation behavior for a request that resolves after its consumer unmounts. */
function definePendingUnmountCase<T>(hook: () => ObservableResource<T>, body: T): void {
  it("does not produce state update warning on unmount during pending fetch", () => {
    let resolveRequest!: (value: unknown) => void;
    const pendingRequest = new Promise((resolve) => {
      resolveRequest = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => pendingRequest));
    const mounted = renderHook(hook);
    expect(mounted.getResult().loading).toBe(true);
    mounted.unmount();
    resolveRequest(jsonResponse(body));
  });
}

/** Registers structured HTTP-error behavior with resource-specific status details. */
function defineHttpErrorCase<T>(contract: EdgeCaseContract<T>): void {
  it(contract.errorTestName, async () => {
    const body = {
      error: {
        code: contract.errorCode ?? "bad_request",
        message: contract.errorMessage ?? "Bad request",
      },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body, contract.errorStatus ?? 400)));
    const mounted = renderHook(contract.hook);
    const result = await flushResource(mounted);
    expect(result.error).toBeTruthy();
    mounted.unmount();
  });
}

/** Registers the shared network, empty, cancellation, and HTTP-error contract for resource hooks. */
export function defineResourceEdgeCases<T>(contract: EdgeCaseContract<T>): void {
  defineResourceLifecycle();
  defineNetworkFailureCase(contract.hook);
  defineEmptyResponseCase(contract);
  definePendingUnmountCase(contract.hook, contract.emptyBody);
  defineHttpErrorCase(contract);
}
