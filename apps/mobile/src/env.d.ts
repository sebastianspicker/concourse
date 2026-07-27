/** Declares Expo environment typings used by the mobile build and test environment. */
import type { JSX as ReactJsx } from "react";

declare global {
  namespace JSX {
    type Element = ReactJsx.Element;
  }

  namespace NodeJS {
    interface ProcessEnv {
      EXPO_OS?: string;
      EXPO_PUBLIC_BFF_BASE_URL?: string;
      NODE_ENV?: string;
    }
  }
}

export {};
