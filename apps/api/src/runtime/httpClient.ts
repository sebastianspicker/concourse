/** Enforces the public-upstream fetch boundary, including SSRF defenses and bounded I/O. */
import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpRequest, type ClientRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest, type RequestOptions } from "node:https";
import { BlockList, isIP } from "node:net";
import { isPublicHttpUrl } from "@concourse/contracts";
import { assertSuccessfulResponse, MAX_RESPONSE_BYTES } from "./httpResponse";

export class TimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

const MAX_REDIRECTS = 3;

/** Races cancellation while removing its listener after either outcome. */
function raceWithAbort<T>(promise: Promise<T>, signal: AbortSignal, createAbortError: () => Error): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const onAbort = () => finish(() => reject(createAbortError()));
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    const finish = (complete: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      complete();
    };
    promise.then((value) => finish(() => resolve(value)), (error: unknown) => finish(() => reject(error)));
    if (signal.aborted) onAbort();
    else {
      signal.addEventListener("abort", onAbort, { once: true });
      if (signal.aborted) onAbort();
    }
  });
}

type LookupResult = { address: string; family: number };
type Lookup = (hostname: string, options: { all: true; verbatim: true }) => Promise<LookupResult[]>;
type Request = (url: URL, options: RequestOptions, callback: (response: IncomingMessage) => void) => ClientRequest;
type ResolvedPublicUrl = { parsed: URL; hostname: string; addresses: LookupResult[] };
type ParsedPublicUrl = Omit<ResolvedPublicUrl, "addresses">;
type AddressRequestContext = ParsedPublicUrl & {
  request: Request;
  signal: AbortSignal;
};
type AddressRequestOptions = AddressRequestContext & { address: LookupResult };
type RequestAttempt = {
  clientRequest?: ClientRequest;
  onAbort?: () => void;
  response?: IncomingMessage;
  settled: boolean;
  signal: AbortSignal;
  resolve: (value: { request: ClientRequest; response: IncomingMessage }) => void;
  reject: (error: Error) => void;
};
type AddressRequestResult =
  | { connection: { request: ClientRequest; response: IncomingMessage } }
  | { error: unknown };

export interface FetchTextDependencies {
  lookup?: Lookup;
  httpRequest?: Request;
  httpsRequest?: Request;
}

export interface FetchTextOptions {
  signal?: AbortSignal;
}

/** Blocks private, loopback, and documentation address ranges from upstream fetches. */
function createBlockedAddressList(): BlockList {
  const addresses = new BlockList();
  addresses.addSubnet("0.0.0.0", 8, "ipv4");
  addresses.addSubnet("10.0.0.0", 8, "ipv4");
  addresses.addSubnet("100.64.0.0", 10, "ipv4");
  addresses.addSubnet("127.0.0.0", 8, "ipv4");
  addresses.addSubnet("169.254.0.0", 16, "ipv4");
  addresses.addSubnet("172.16.0.0", 12, "ipv4");
  addresses.addSubnet("192.0.0.0", 24, "ipv4");
  addresses.addSubnet("192.0.2.0", 24, "ipv4");
  addresses.addSubnet("192.88.99.0", 24, "ipv4");
  addresses.addSubnet("192.168.0.0", 16, "ipv4");
  addresses.addSubnet("198.18.0.0", 15, "ipv4");
  addresses.addSubnet("198.51.100.0", 24, "ipv4");
  addresses.addSubnet("203.0.113.0", 24, "ipv4");
  addresses.addSubnet("224.0.0.0", 4, "ipv4");
  addresses.addSubnet("240.0.0.0", 4, "ipv4");
  addresses.addSubnet("2001::", 32, "ipv6");
  addresses.addSubnet("2001:2::", 48, "ipv6");
  addresses.addSubnet("2001:db8::", 32, "ipv6");
  addresses.addSubnet("2002::", 16, "ipv6");
  return addresses;
}

/** Limits IPv6 fetch targets to the globally routable range. */
function createPublicIpv6AddressList(): BlockList {
  const addresses = new BlockList();
  addresses.addSubnet("2000::", 3, "ipv6");
  return addresses;
}

const blockedAddresses = createBlockedAddressList();
const publicIpv6Addresses = createPublicIpv6AddressList();

/** Accepts DNS results only when their normalized address passes the public-host policy. */
function isValidPublicResult(result: LookupResult): boolean {
  const family = isIP(normalizeHostname(result.address));
  return family !== 0 && family === result.family && !isDisallowedAddress(result.address);
}

/** Rejects credentials, non-HTTP(S), local, and literal private fetch targets. */
function parsePublicUrl(url: string): ParsedPublicUrl {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid fetch URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Fetch URL must use http or https");
  if (parsed.username || parsed.password) throw new Error("Fetch URL must not include credentials");
  const hostname = normalizeHostname(parsed.hostname);
  if (!isPublicHttpUrl(url) || isDisallowedAddress(hostname)) throw new Error("Fetch URL must target a public host");
  return { parsed, hostname };
}

/** Rejects an entire DNS answer set unless every result is a valid public address. */
async function resolvePublicAddresses(hostname: string, lookup: Lookup, signal: AbortSignal): Promise<LookupResult[]> {
  let addresses: LookupResult[];
  try {
    addresses = await abortable(lookup(hostname, { all: true, verbatim: true }), signal);
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error("Fetch URL host could not be resolved");
  }
  if (addresses.length === 0 || !addresses.every(isValidPublicResult)) {
    throw new Error("Fetch URL must target a public host");
  }
  return addresses;
}

/** Couples URL validation to the DNS results later pinned into the request. */
async function resolvePublicUrl(url: string, lookup: Lookup, signal: AbortSignal): Promise<ResolvedPublicUrl> {
  const { parsed, hostname } = parsePublicUrl(url);
  const addresses = await resolvePublicAddresses(hostname, lookup, signal);
  return { parsed, hostname, addresses };
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/** Rejects malformed redirects and caps the chain before another public-host validation pass. */
function redirectTarget(response: IncomingMessage, currentUrl: URL, redirects: number): string | null {
  if (!REDIRECT_STATUSES.has(response.statusCode ?? 0)) return null;
  try {
    if (redirects >= MAX_REDIRECTS) throw new Error(`Fetch URL exceeded ${MAX_REDIRECTS} redirects`);
    const rawLocation = response.headers.location;
    const location = Array.isArray(rawLocation) ? rawLocation[0] : rawLocation;
    if (!location) throw new Error("Redirect response missing Location header");
    return new URL(location, currentUrl).toString();
  } finally {
    response.destroy();
  }
}

function readResponse(response: IncomingMessage, request: ClientRequest, signal: AbortSignal): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let total = 0;
    const chunks: Buffer[] = [];
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      if (error) reject(error);
      else resolve(Buffer.concat(chunks, total).toString("utf8"));
    };
    const onAbort = () => {
      const error = abortError();
      request.destroy(error);
      response.destroy(error);
      finish(error);
    };
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) {
      onAbort();
      return;
    }
    response.on("data", (chunk: Buffer | Uint8Array | string) => {
      if (settled) return;
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      if (buffer.byteLength > MAX_RESPONSE_BYTES || total + buffer.byteLength > MAX_RESPONSE_BYTES) {
        const error = new Error(`Response body exceeds ${MAX_RESPONSE_BYTES} bytes`);
        response.destroy(error);
        finish(error);
        return;
      }
      total += buffer.byteLength;
      chunks.push(buffer);
    });
    response.once("end", () => finish());
    response.once("error", (error: Error) => finish(error));
  });
}

/** Settles a connection attempt once across response, error, and cancellation races. */
function settleRequestAttempt(attempt: RequestAttempt, error?: Error, response?: IncomingMessage): void {
  if (attempt.settled) return;
  attempt.settled = true;
  if (attempt.onAbort) attempt.signal.removeEventListener("abort", attempt.onAbort);
  if (error) {
    attempt.reject(error);
    return;
  }
  attempt.resolve({ request: attempt.clientRequest!, response: response! });
}

/** Destroys partially opened request resources when the shared signal aborts. */
function abortRequestAttempt(this: RequestAttempt): void {
  const error = abortError();
  this.clientRequest?.destroy(error);
  this.response?.destroy(error);
  settleRequestAttempt(this, error);
}

/** Closes a response that arrives after its request attempt has settled. */
function acceptRequestResponse(attempt: RequestAttempt, incoming: IncomingMessage): void {
  attempt.response = incoming;
  if (attempt.settled) {
    incoming.destroy(abortError());
    return;
  }
  settleRequestAttempt(attempt, undefined, incoming);
}

/** Uses a non-pooled request with DNS pinned to a previously validated address. */
function requestText(options: AddressRequestOptions): Promise<{ request: ClientRequest; response: IncomingMessage }> {
  const { parsed, hostname, address, request, signal } = options;
  return new Promise<{ request: ClientRequest; response: IncomingMessage }>((resolve, reject) => {
    const attempt: RequestAttempt = { settled: false, signal, resolve, reject };
    attempt.onAbort = abortRequestAttempt.bind(attempt);
    try {
      attempt.clientRequest = request(parsed, {
        agent: false,
        family: address.family,
        headers: { Accept: "text/plain, text/html, */*", "Accept-Encoding": "identity", Host: parsed.host },
        hostname,
        lookup: pinnedLookup(hostname, address),
        method: "GET",
        path: `${parsed.pathname}${parsed.search}`,
        port: parsed.port || undefined,
        rejectUnauthorized: true,
        servername: isIP(hostname) === 0 ? hostname : undefined
      }, (incoming) => acceptRequestResponse(attempt, incoming));
      attempt.clientRequest.once("error", (error: Error) => settleRequestAttempt(attempt, error));
      signal.addEventListener("abort", attempt.onAbort, { once: true });
      if (signal.aborted) attempt.onAbort();
      else attempt.clientRequest.end();
    } catch (error) {
      settleRequestAttempt(attempt, error instanceof Error ? error : new Error("HTTP request failed"));
    }
  });
}

/** Attempts validated DNS results in order without converting cancellation into a retry. */
async function requestAddress(options: AddressRequestContext, address: LookupResult): Promise<AddressRequestResult> {
  throwIfAborted(options.signal);
  try {
    return { connection: await requestText({ ...options, address }) };
  } catch (error: unknown) {
    if (options.signal.aborted) throw error;
    return { error };
  }
}

/** Tries each validated address so one unreachable address does not fail the source. */
async function requestFirstReachableAddress(
  options: AddressRequestContext & { addresses: LookupResult[] }
): Promise<{ request: ClientRequest; response: IncomingMessage }> {
  let lastError: unknown;
  for (const address of options.addresses) {
    const result = await requestAddress(options, address);
    if ("connection" in result) return result.connection;
    lastError = result.error;
  }
  throw lastError instanceof Error ? lastError : new Error("HTTP request failed for every resolved address");
}

/** Refuses resolver callbacks for a hostname other than the validated original target. */
function pinnedLookup(expectedHostname: string, address: LookupResult): RequestOptions["lookup"] {
  return (hostname, _options, callback) => {
    if (normalizeHostname(hostname) !== expectedHostname) {
      const error = Object.assign(new Error("Unexpected lookup hostname"), { code: "ENOTFOUND" });
      callback(error, "", 0);
      return;
    }
    callback(null, address.address, address.family);
  };
}

function abortError(): DOMException {
  return new DOMException("The operation was aborted", "AbortError");
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw abortError();
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return raceWithAbort(promise, signal, abortError);
}

/**
 * Creates the bounded upstream-text fetch seam. It rejects unsafe targets,
 * timeouts, oversized bodies, and non-success responses before returning text.
 */
export function createFetchTextWithTimeout(dependencies: FetchTextDependencies = {}) {
  const lookup: Lookup = dependencies.lookup ?? dnsLookup as Lookup;
  const http = dependencies.httpRequest ?? httpRequest as Request;
  const https = dependencies.httpsRequest ?? httpsRequest as Request;

  return async function fetchTextWithTimeout(url: string, options?: FetchTextOptions, timeoutMs = 10_000): Promise<string> {
    const deadline = new AbortController();
    const signal = options?.signal ? AbortSignal.any([deadline.signal, options.signal]) : deadline.signal;
    const timer = setTimeout(() => deadline.abort(), timeoutMs);
    try {
      let target = url;
      for (let redirects = 0; ; redirects += 1) {
        throwIfAborted(signal);
        const { parsed, hostname, addresses } = await resolvePublicUrl(target, lookup, signal);
        const connection = await requestFirstReachableAddress({
          parsed,
          hostname,
          addresses,
          request: parsed.protocol === "https:" ? https : http,
          signal
        });
        const { request, response } = connection;
        const nextTarget = redirectTarget(response, parsed, redirects);
        if (nextTarget) {
          target = nextTarget;
          continue;
        }
        assertSuccessfulResponse(response);
        return await readResponse(response, request, signal);
      }
    } catch (error) {
      if (deadline.signal.aborted) throw new TimeoutError(url, timeoutMs);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replaceAll("[", "").replaceAll("]", "");
}

/** Rejects literal private, loopback, link-local, and unsupported address targets. */
function isDisallowedAddress(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  const family = isIP(host);
  if (host === "localhost") return true;
  if (family === 4) return blockedAddresses.check(host, "ipv4");
  if (family === 6) return !publicIpv6Addresses.check(host, "ipv6") || blockedAddresses.check(host, "ipv6");
  return false;
}

export const fetchTextWithTimeout = createFetchTextWithTimeout();
