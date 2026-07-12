export class TimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

const LOCAL_HOSTS = new Set(["localhost", "::1", "0:0:0:0:0:0:0:1", "0.0.0.0"]);

function isLocalHost(host: string): boolean {
  return LOCAL_HOSTS.has(host);
}

const PRIVATE_IPV6_PREFIXES = ["fc", "fd", "fe80:"] as const;

function isPrivateIpv6Host(host: string): boolean {
  return host === "::" || PRIVATE_IPV6_PREFIXES.some((prefix) => host.startsWith(prefix));
}

const PRIVATE_IPV4_RANGES = {
  linkLocalFirst: 169,
  linkLocalSecond: 254,
  localFirst: 127,
  privateFirst: 10,
  privateSecondFirst: 172,
  privateSecondMax: 31,
  privateSecondMin: 16,
  siteLocalFirst: 192,
  siteLocalSecond: 168
} as const;

function parseIpv4Host(host: string): [number, number, number, number] | null {
  const octets = host.split(".").map((part) => Number(part));
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }

  return octets as [number, number, number, number];
}

const PRIVATE_IPV4_SINGLE_FIRST_OCTETS: ReadonlySet<number> = new Set([
  PRIVATE_IPV4_RANGES.privateFirst,
  PRIVATE_IPV4_RANGES.localFirst
]);

function isPrivateIpv4Host(host: string): boolean {
  const octets = parseIpv4Host(host);
  if (!octets) return false;
  const [first, second] = octets;
  return PRIVATE_IPV4_SINGLE_FIRST_OCTETS.has(first) || isPrivateIpv4Pair(first, second);
}

const SECOND_PRIVATE_IPV4_RANGE = PRIVATE_IPV4_RANGES.privateSecondFirst;

function isPrivateIpv4Pair(first: number, second: number): boolean {
  if (first === PRIVATE_IPV4_RANGES.linkLocalFirst) return second === PRIVATE_IPV4_RANGES.linkLocalSecond;
  if (first === PRIVATE_IPV4_RANGES.siteLocalFirst) return second === PRIVATE_IPV4_RANGES.siteLocalSecond;
  if (first !== SECOND_PRIVATE_IPV4_RANGE) return false;
  return second >= PRIVATE_IPV4_RANGES.privateSecondMin && second <= PRIVATE_IPV4_RANGES.privateSecondMax;
}

const BRACKETED_HOST_PATTERN = /^\[(.*)\]$/;

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(BRACKETED_HOST_PATTERN, "$1");
}

const PRIVATE_HOST_CHECKS = [isLocalHost, isPrivateIpv6Host, isPrivateIpv4Host] as const;

function isPrivateHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  return PRIVATE_HOST_CHECKS.some((check) => check(host));
}

function assertPublicHttpUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid fetch URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Fetch URL must use http or https");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Fetch URL must not include credentials");
  }

  if (isPrivateHost(parsed.hostname)) {
    throw new Error("Fetch URL must target a public host");
  }
}

export async function fetchWithTimeout(
  url: string,
  options?: FetchTimeoutOptions,
  timeoutMs = 10_000
): Promise<Response> {
  assertPublicHttpUrl(url);

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  const signal = options?.signal
    ? AbortSignal.any([timeoutController.signal, options.signal])
    : timeoutController.signal;

  try {
    return await fetch(url, { ...options, signal });
  } catch (err: unknown) {
    if (
      err instanceof DOMException &&
      err.name === "AbortError" &&
      timeoutController.signal.aborted
    ) {
      throw new TimeoutError(url, timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Fetch a URL and return the response body as text, enforcing a 10 MB size limit.
 * Throws if the response status is not ok, if Content-Length exceeds the limit,
 * or if the streamed body exceeds the limit.
 */
export async function fetchTextWithTimeout(
  url: string,
  options?: FetchTimeoutOptions,
  timeoutMs = 10_000
): Promise<string> {
  const response = await fetchWithTimeout(url, options, timeoutMs);
  assertResponseOk(response);
  assertContentLength(response);
  return readLimitedText(response);
}

async function readLimitedText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return response.text();
  }

  let total = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        void reader.cancel();
        throw new Error(`Response body exceeds ${MAX_RESPONSE_BYTES} bytes`);
      }
      chunks.push(value);
    }
  } catch (err: unknown) {
    void reader.cancel();
    throw err;
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

function assertContentLength(response: Response): void {
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_RESPONSE_BYTES) {
    throw new Error(`Response too large: ${contentLength} bytes`);
  }
}

function assertResponseOk(response: Response): void {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

type FetchTimeoutOptions = RequestInit;
