/** Verifies refreshes and unmounts ignore stale request completions. */
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { usePublicResource, type PublicResource } from "../usePublicResource";
import type { ResourceLoadResult } from "../../data/publicApiRequest";

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void };

/** Creates a controllable promise so tests decide when a resource request resolves. */
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => { resolve = next; });
  return { promise, resolve };
}

/** Builds a complete network result so hook tests focus on state transitions rather than response shape. */
const result = (value: number): ResourceLoadResult<number> => ({
  data: value, source: "network", updatedAt: 1, cacheAge: null
});

describe("usePublicResource request ownership", () => {
  it("preserves fulfilled data and exposes refreshing while a key change loads", async () => {
    const initial = deferred<ResourceLoadResult<number>>();
    const filtered = deferred<ResourceLoadResult<number>>();
    const requests = [initial, filtered];
    let state!: PublicResource<number>;
    let renderer!: TestRenderer.ReactTestRenderer;
    const loader = () => requests.shift()!.promise;

    await act(async () => {
      renderer = TestRenderer.create(<Harness loader={loader} resourceKey="all" onState={(next) => { state = next; }} />);
    });
    await act(async () => { initial.resolve(result(1)); });
    expect(state.data).toBe(1);
    expect(state.loading).toBe(false);

    await act(async () => {
      renderer.update(<Harness loader={loader} resourceKey="filtered" onState={(next) => { state = next; }} />);
    });
    expect(state.data).toBe(1);
    expect(state.loading).toBe(false);
    expect(state.refreshing).toBe(true);

    await act(async () => { filtered.resolve(result(2)); });
    expect(state.data).toBe(2);
    expect(state.refreshing).toBe(false);
  });

  it("does not leave initial loading true when refresh supersedes it", async () => {
    const initial = deferred<ResourceLoadResult<number>>();
    const refreshed = deferred<ResourceLoadResult<number>>();
    const requests = [initial, refreshed];
    let state!: PublicResource<number>;
/** Records loader calls and returns a fresh deferred result for the test scenario. */
    const loader = () => requests.shift()!.promise;

    await act(async () => {
      TestRenderer.create(<Harness loader={loader} onState={(next) => { state = next; }} />);
    });
    let refresh!: Promise<void>;
    await act(async () => { refresh = state.refresh(); });
    expect(state.loading).toBe(false);
    expect(state.refreshing).toBe(true);

    await act(async () => { refreshed.resolve(result(2)); await refresh; });
    expect(state.refreshing).toBe(false);
    expect(state.data).toBe(2);
  });

  it("keeps refreshing true until the latest overlapping refresh completes", async () => {
    const initial = deferred<ResourceLoadResult<number>>();
    const firstRefresh = deferred<ResourceLoadResult<number>>();
    const secondRefresh = deferred<ResourceLoadResult<number>>();
    const requests = [initial, firstRefresh, secondRefresh];
    let state!: PublicResource<number>;
/** Simulates a loader that remains pending until the test resolves its captured promise. */
    const loader = () => requests.shift()!.promise;

    await act(async () => {
      TestRenderer.create(<Harness loader={loader} onState={(next) => { state = next; }} />);
    });
    let one!: Promise<void>;
    let two!: Promise<void>;
    await act(async () => { one = state.refresh(); two = state.refresh(); });
    await act(async () => { firstRefresh.resolve(result(1)); await one; });
    expect(state.refreshing).toBe(true);
    await act(async () => { secondRefresh.resolve(result(2)); await two; });
    expect(state.refreshing).toBe(false);
    expect(state.data).toBe(2);
  });

  it("clears refreshing when a key change supersedes the refresh", async () => {
    const initial = deferred<ResourceLoadResult<number>>();
    const refreshed = deferred<ResourceLoadResult<number>>();
    const nextKey = deferred<ResourceLoadResult<number>>();
    const requests = [initial, refreshed, nextKey];
    let state!: PublicResource<number>;
/** Produces a loader whose successive completions expose stale-request handling. */
    const loader = () => requests.shift()!.promise;
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<Harness loader={loader} resourceKey="one" onState={(next) => { state = next; }} />);
    });
    let refresh!: Promise<void>;
    await act(async () => { refresh = state.refresh(); });
    expect(state.refreshing).toBe(true);

    await act(async () => {
      renderer.update(<Harness loader={loader} resourceKey="two" onState={(next) => { state = next; }} />);
    });
    expect(state.refreshing).toBe(false);
    expect(state.loading).toBe(true);

    await act(async () => {
      refreshed.resolve(result(1));
      nextKey.resolve(result(2));
      await refresh;
    });
    expect(state.data).toBe(2);
  });
});

/** Mounts the resource hook and exposes its state through the test renderer. */
function Harness({ loader, resourceKey, onState }: {
  loader: () => Promise<ResourceLoadResult<number>>;
  resourceKey?: string;
  onState: (state: PublicResource<number>) => void;
}): null {
  onState(usePublicResource(loader, resourceKey));
  return null;
}
