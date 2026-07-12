import type { JSX as ReactJsx } from "react";

declare global {
  namespace JSX {
    type Element = ReactJsx.Element;
  }

  const process: {
    env: {
      EXPO_OS?: string;
      EXPO_PUBLIC_BFF_BASE_URL?: string;
      NODE_ENV?: string;
      [key: string]: string | undefined;
    };
  };
}

export {};
