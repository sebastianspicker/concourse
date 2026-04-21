import React from "react";
import TestRenderer, { act } from "react-test-renderer";

export function renderHook<T>(hook: () => T): {
  getResult: () => T;
  flush: () => Promise<void>;
  unmount: () => void;
} {
  let current!: T;

  function TestComponent(): JSX.Element | null {
    current = hook();
    return null;
  }

  const renderer = TestRenderer.create(<TestComponent />);

  async function flush(): Promise<void> {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  return {
    getResult: () => current,
    flush,
    unmount: () => renderer.unmount()
  };
}
