/** End-to-end regression coverage for the documented mobile flow. */
import TestRenderer, { act } from "react-test-renderer";

export type RenderedHook<T> = {
  getResult: () => T;
  flush: () => Promise<void>;
  unmount: () => void;
};

/** Mounts a hook test component and returns its latest observable value. */
export function renderHook<T>(hook: () => T): RenderedHook<T> {
  let current!: T;

/** Invokes the supplied hook during test rendering and stores its current result. */
  function TestComponent(): JSX.Element | null {
    current = hook();
    return null;
  }

  const renderer = TestRenderer.create(<TestComponent />);

/** Flushes pending React effects before assertions inspect the hook result. */
  async function flush(): Promise<void> {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  return {
    getResult: () => current,
    flush,
    unmount: () => {
      act(() => {
        renderer.unmount();
      });
    }
  };
}
