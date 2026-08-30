/** Resolves and memoizes the BFF base URL with development-safe fallback behavior. */
import { normalizeBffBaseUrl } from "../../../config/bffOriginPolicy";

export {
  assertCredentialFreeBffUrl,
  assertOriginOnlyBffUrl,
  isLoopbackHost,
  isPermittedDevelopmentBffUrl,
  isReleaseRestrictedHost,
  isSpecialUseIpv4Address,
  isSpecialUseIpv6Address,
  normalizeBffBaseUrl,
  normalizeHostname,
} from "../../../config/bffOriginPolicy";

let memoizedBffBaseUrl: string | null = null;

/** Returns whether this runtime is an explicitly enabled development build. */
export function isDevelopmentBffEnvironment(): boolean {
  const developmentFlag = (globalThis as { __DEV__?: unknown }).__DEV__;
  return developmentFlag === true;
}

/** @internal Resets the memoized URL for test isolation. */
export function _resetBffBaseUrlMemoForTests(): void {
  memoizedBffBaseUrl = null;
}

/** Reads and memoizes the configured BFF origin, failing before requests can use an empty URL. */
export function resolveBffBaseUrl(): string {
  if (memoizedBffBaseUrl) return memoizedBffBaseUrl;

  const result = ((): string => {
    const fromConfig = process.env.EXPO_PUBLIC_BFF_BASE_URL;

    if (fromConfig) {
      return normalizeBffBaseUrl(fromConfig, isDevelopmentBffEnvironment());
    }

    throw new Error(
      "Missing BFF base URL. Set EXPO_PUBLIC_BFF_BASE_URL for the mobile app in development and production."
    );
  })();

  memoizedBffBaseUrl = result;
  return result;
}
