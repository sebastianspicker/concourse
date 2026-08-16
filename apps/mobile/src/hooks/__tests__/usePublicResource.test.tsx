/** Verifies refreshes and unmounts ignore stale request completions. */
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { usePublicResource, type PublicResource } from "../usePublicResource";
import type { ResourceLoadResult } from "../../data/publicApiRequest";

type LoadControls = { force?: boolean; signal?: AbortSignal };
type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

/** Creates a controllable promise so tests decide when a resource request resolves. */
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((next, fail) => { resolve = next; reject = fail; });
  return { promise, resolve, reject };
}

/** Builds a complete network result so hook tests focus on state transitions rather than response shape. */
const result = (
  value: number,
  source: ResourceLoadResult<number>["source"] = "network",
  updatedAt = value,
  cacheAge: number | null = null
): ResourceLoadResult<number> => ({ data: value, source, updatedAt, cacheAge });

/** Queues exact request completions and records controls passed by the hook. */
function queuedLoader(...requests: Deferred<ResourceLoadResult<number>>[]) {
  const calls: LoadControls[] = [];
  return {
    calls,
    loader: vi.fn((controls: LoadControls) => {
      calls.push(controls);
      const request = requests.shift();
      if (!request) throw new Error("Unexpected resource request");
      return request.promise;
    }),
  };
}

/** Mounts one hook instance and exposes its latest observable state and renderer operations. */
function resourceFixture(loader: (controls: LoadControls) => Promise<ResourceLoadResult<number>>) {
  let current!: PublicResource<number>;
  let renderer!: TestRenderer.ReactTestRenderer;
  let renderCount = 0;
  const observe = (next: PublicResource<number>) => { current = next; renderCount += 1; };
  const render = (resourceKey?: string) => <Harness loader={loader} resourceKey={resourceKey} onState={observe} />;

  return {
    get state() { return current; },
    get renderCount() { return renderCount; },
    mount: async (resourceKey?: string) => {
      await act(async () => { renderer = TestRenderer.create(render(resourceKey)); });
    },
    update: async (resourceKey?: string) => {
      await act(async () => { renderer.update(render(resourceKey)); });
    },
    unmount: async () => {
      await act(async () => { renderer.unmount(); });
    },
  };
}

/** Prepares a hook instance with a fixed count of loader requests. */
function resourceScenario(requestCount: number) {
  const requests = Array.from({ length: requestCount }, () => deferred<ResourceLoadResult<number>>());
  const queue = queuedLoader(...requests);
  return { fixture: resourceFixture(queue.loader), requests, calls: queue.calls };
}

/** Settles a deferred request inside React's update boundary. */
async function resolve(request: Deferred<ResourceLoadResult<number>>, value: ResourceLoadResult<number>): Promise<void> {
  await act(async () => { request.resolve(value); });
}

/** Rejects a deferred request inside React's update boundary. */
async function reject(request: Deferred<ResourceLoadResult<number>>, reason: unknown): Promise<void> {
  await act(async () => { request.reject(reason); });
}

/** Starts the current resource's force refresh and returns its completion promise. */
async function startRefresh(fixture: ReturnType<typeof resourceFixture>): Promise<{ refresh: Promise<void> }> {
  let refresh!: Promise<void>;
  await act(async () => { refresh = fixture.state.refresh(); });
  return { refresh };
}

describe("usePublicResource request ownership", () => {
  it("maps an owning synchronous TypeError into an offline error and settles initial state", async () => {
    const loader = vi.fn((_controls: LoadControls): Promise<ResourceLoadResult<number>> => {
      throw new TypeError("offline");
    });
    const fixture = resourceFixture(loader);

    await fixture.mount();
    expect(fixture.state).toMatchObject({ error: { kind: "offline" }, loading: false, refreshing: false });
  });

  it("maps an owning rejected TypeError into an offline error and settles initial state", async () => {
    const loader = vi.fn((_controls: LoadControls) => Promise.reject(new TypeError("offline")));
    const fixture = resourceFixture(loader);

    await fixture.mount();
    expect(fixture.state).toMatchObject({ error: { kind: "offline" }, loading: false, refreshing: false });
  });

  it("clears an accepted error while a key change begins its replacement load", async () => {
    const { fixture, requests: [failed, replacement] } = resourceScenario(2);

    await fixture.mount("one");
    await reject(failed, new TypeError("offline"));
    expect(fixture.state.error).toMatchObject({ kind: "offline" });

    await fixture.update("two");
    expect(fixture.state).toMatchObject({ error: null, loading: true, refreshing: false });
    await resolve(replacement, result(2));
  });

  it("preserves fulfilled data and exposes refreshing while a key change loads", async () => {
    const { fixture, requests: [initial, filtered], calls } = resourceScenario(2);

    await fixture.mount("all");
    await resolve(initial, result(1, "persisted-cache", 8, 3_000));
    await fixture.update("filtered");
    expect(fixture.state).toMatchObject({ data: 1, loading: false, refreshing: true, error: null });
    expect(calls.map(({ force }) => force)).toEqual([false, false]);

    await resolve(filtered, result(2, "memory-cache", 9, 0));
    expect(fixture.state).toMatchObject({ data: 2, source: "memory-cache", updatedAt: 9, cacheAge: 0, refreshing: false });
  });

  it.each([
    ["resolves", (request: Deferred<ResourceLoadResult<number>>) => request.resolve(result(1))],
    ["rejects", (request: Deferred<ResourceLoadResult<number>>) => request.reject(new TypeError("offline"))],
  ])("ignores a stale key request that %s and lets only the latest cleanup settle loading", async (_outcome, settleStale) => {
    const { fixture, requests: [first, second] } = resourceScenario(2);

    await fixture.mount("one");
    await fixture.update("two");
    await act(async () => { settleStale(first); });
    expect(fixture.state).toMatchObject({ data: null, error: null, loading: true, refreshing: false });

    await resolve(second, result(2));
    expect(fixture.state).toMatchObject({ data: 2, error: null, loading: false, refreshing: false });
  });

  it("aborts on unmount and suppresses a late cancellation completion", async () => {
    const { fixture, requests: [pending], calls } = resourceScenario(1);

    await fixture.mount();
    await fixture.unmount();
    const renderCount = fixture.renderCount;
    expect(calls[0]?.signal?.aborted).toBe(true);

    await reject(pending, Object.assign(new Error("cancelled"), { name: "AbortError" }));
    expect(fixture.renderCount).toBe(renderCount);
  });

  it("does not read result fields from a late success after unmount", async () => {
    const { fixture, requests: [pending] } = resourceScenario(1);
    const data = vi.fn(() => 1);
    const source = vi.fn(() => "network" as const);
    const updatedAt = vi.fn(() => 1);
    const cacheAge = vi.fn(() => null);
    const lateResult = Object.defineProperties({}, {
      data: { get: data },
      source: { get: source },
      updatedAt: { get: updatedAt },
      cacheAge: { get: cacheAge },
    }) as ResourceLoadResult<number>;

    await fixture.mount();
    await fixture.unmount();
    await resolve(pending, lateResult);
    for (const getter of [data, source, updatedAt, cacheAge]) {
      expect(getter).not.toHaveBeenCalled();
    }
  });

  it("suppresses a current cancellation without exposing a UI error", async () => {
    const { fixture, requests: [pending] } = resourceScenario(1);

    await fixture.mount();
    await reject(pending, Object.assign(new Error("cancelled"), { name: "AbortError" }));
    expect(fixture.state).toMatchObject({ error: null, loading: false, refreshing: false });
  });

  it("aborts before replacing a request with a force refresh", async () => {
    const { fixture, requests: [_initial, refreshed], calls } = resourceScenario(2);

    await fixture.mount();
    const { refresh } = await startRefresh(fixture);
    expect(calls[0]?.signal?.aborted).toBe(true);
    expect(calls[1]).toMatchObject({ force: true });
    expect(fixture.state).toMatchObject({ loading: false, refreshing: true });

    await act(async () => { refreshed.resolve(result(2)); await refresh; });
    expect(fixture.state).toMatchObject({ data: 2, refreshing: false });
  });

  it("keeps refreshing true until the latest overlapping refresh completes", async () => {
    const { fixture, requests: [_initial, firstRefresh, secondRefresh] } = resourceScenario(3);

    await fixture.mount();
    const { refresh: first } = await startRefresh(fixture);
    const { refresh: second } = await startRefresh(fixture);
    await act(async () => { firstRefresh.resolve(result(1)); await first; });
    expect(fixture.state.refreshing).toBe(true);
    await act(async () => { secondRefresh.resolve(result(2)); await second; });
    expect(fixture.state).toMatchObject({ data: 2, refreshing: false });
  });

  it("clears refresh state when a key change supersedes the refresh", async () => {
    const { fixture, requests: [_initial, refreshed, nextKey] } = resourceScenario(3);

    await fixture.mount("one");
    const { refresh } = await startRefresh(fixture);
    await fixture.update("two");
    expect(fixture.state).toMatchObject({ loading: true, refreshing: false });

    await act(async () => { refreshed.resolve(result(1)); nextKey.resolve(result(2)); await refresh; });
    expect(fixture.state).toMatchObject({ data: 2, loading: false, refreshing: false });
  });
});

/** Mounts the resource hook and exposes its state through the test renderer. */
function Harness({ loader, resourceKey, onState }: {
  loader: (controls: LoadControls) => Promise<ResourceLoadResult<number>>;
  resourceKey?: string;
  onState: (state: PublicResource<number>) => void;
}): null {
  onState(usePublicResource(loader, resourceKey));
  return null;
}
