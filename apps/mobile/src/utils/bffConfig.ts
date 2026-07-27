/** Resolves and memoizes the BFF base URL with development-safe fallback behavior. */
let memoizedBffBaseUrl: string | null = null;

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
      return normalizeBaseUrl(fromConfig);
    }

    throw new Error(
      "Missing BFF base URL. Set EXPO_PUBLIC_BFF_BASE_URL for the mobile app in development and production."
    );
  })();

  memoizedBffBaseUrl = result;
  return result;
}

/** Trims trailing slashes and rejects invalid or non-HTTP BFF origins. */
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
