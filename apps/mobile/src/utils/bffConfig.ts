/** Resolves and memoizes the BFF base URL with development-safe fallback behavior. */
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

/** Normalizes a BFF origin while allowing loopback HTTP only in explicit development builds. */
export function normalizeBffBaseUrl(input: string, isDevelopment: boolean): string {
  const trimmed = input.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`Invalid BFF base URL: ${input}`);
  }

  assertCredentialFreeBffUrl(url);
  assertOriginOnlyBffUrl(url);

  if (isPermittedDevelopmentBffUrl(url, isDevelopment)) {
    return url.origin;
  }

  if (url.protocol !== "https:") {
    throw new Error("BFF base URL must use HTTPS outside loopback development");
  }

  if (!isDevelopment && isReleaseRestrictedHost(url.hostname)) {
    throw new Error("BFF base URL must not use a localhost or special-use IP address in release builds");
  }

  return url.origin;
}

/** Rejects configured BFF origins that could carry URL user-info. @internal */
export function assertCredentialFreeBffUrl(url: URL): void {
  if (url.username || url.password) {
    throw new Error("BFF base URL must not include credentials");
  }
}

/** Rejects configured BFF endpoints so every client request starts from an origin. @internal */
export function assertOriginOnlyBffUrl(url: URL): void {
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("BFF base URL must be an origin without a path, query, or fragment");
  }
}

/** Identifies an explicitly permitted plaintext development URL. @internal */
export function isPermittedDevelopmentBffUrl(url: URL, isDevelopment: boolean): boolean {
  return url.protocol === "http:" && isDevelopment && isLoopbackHost(url.hostname);
}

/** Identifies the only hosts that may receive plaintext development traffic. @internal */
export function isLoopbackHost(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

/** Rejects local names and special-purpose numeric addresses in preview and production. @internal */
export function isReleaseRestrictedHost(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  return normalized === "localhost" || normalized.endsWith(".localhost") ||
    isSpecialUseIpv4Address(normalized) || isSpecialUseIpv6Address(normalized);
}

/** Removes URL's IPv6 brackets and a DNS trailing dot before host classification. @internal */
export function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

const SPECIAL_USE_IPV4_RANGES: readonly (readonly [number, number])[] = [
  [0x00000000, 0x00ffffff], [0x0a000000, 0x0affffff], [0x64400000, 0x647fffff],
  [0x7f000000, 0x7fffffff], [0xa9fe0000, 0xa9feffff], [0xac100000, 0xac1fffff],
  [0xc0000000, 0xc000ffff], [0xc0020000, 0xc002ffff], [0xc0580000, 0xc058ffff],
  [0xc0a80000, 0xc0a8ffff], [0xc6120000, 0xc613ffff], [0xc6330000, 0xc633ffff],
  [0xcb007100, 0xcb0071ff], [0xe0000000, 0xffffffff],
];

/** Classifies RFC special-use IPv4 blocks after URL parsing has normalized alternate notation. @internal */
export function isSpecialUseIpv4Address(hostname: string): boolean {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const address = octets.reduce((value, octet) => value * 256 + octet, 0);
  return SPECIAL_USE_IPV4_RANGES.some(([start, end]) => address >= start && address <= end);
}

/** Classifies loopback, unique-local, link-local, and IPv4-mapped IPv6 literals. @internal */
export function isSpecialUseIpv6Address(hostname: string): boolean {
  if (!hostname.includes(":")) return false;
  return hostname === "::" || hostname === "::1" || hostname.startsWith("fc") ||
    hostname.startsWith("fd") || /^fe[89ab]/.test(hostname) || hostname.startsWith("::ffff:");
}
