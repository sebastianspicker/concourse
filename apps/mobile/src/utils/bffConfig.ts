let memoizedBffBaseUrl: string | null = null;

/** @internal — resets memoized URL for test isolation */
export function _resetBffBaseUrlMemoForTests(): void {
  memoizedBffBaseUrl = null;
}

export function resolveBffBaseUrl(): string {
  if (memoizedBffBaseUrl) return memoizedBffBaseUrl;

  const result = ((): string => {
    // Try various ways to get the BFF URL
    const fromConfig = process.env.EXPO_PUBLIC_BFF_BASE_URL;

    // Always prefer the env var when set, even in dev mode
    if (fromConfig) {
      return normalizeBaseUrl(fromConfig);
    }

    // For development, fall back to localhost:4000 when env var is not set
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      return "http://localhost:4000";
    }

    throw new Error(
      "Missing BFF base URL. Set EXPO_PUBLIC_BFF_BASE_URL for the mobile app build."
    );
  })();

  memoizedBffBaseUrl = result;
  return result;
}

function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`Invalid BFF base URL: ${input}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Invalid BFF base URL protocol: ${url.protocol}`);
  }
  return trimmed;
}
