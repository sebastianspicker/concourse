import ReactTestRenderer, { act, type TestRendererOptions } from "react-test-renderer";
import type React from "react";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const originalCreate = ReactTestRenderer.create.bind(ReactTestRenderer);
ReactTestRenderer.create = ((element: React.ReactElement, options?: TestRendererOptions) => {
  let renderer: ReturnType<typeof originalCreate> | undefined;
  act(() => {
    renderer = originalCreate(element, options);
  });
  return renderer!;
}) as typeof ReactTestRenderer.create;
