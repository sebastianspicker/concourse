import type { IncomingMessage } from "node:http";
import { isIP } from "node:net";
import type { TrustProxyMode } from "../config/env";

const IPV6_MAPPED_IPV4_PREFIX = "::ffff:";

function normalizeIp(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Strip IPv6 zone IDs (e.g., "fe80::1%eth0" -> "fe80::1") for consistent comparison
  const withoutZone = trimmed.split("%")[0];
  const withoutMappedV6 = withoutZone.startsWith(IPV6_MAPPED_IPV4_PREFIX)
    ? withoutZone.slice(IPV6_MAPPED_IPV4_PREFIX.length)
    : withoutZone;
  return withoutMappedV6;
}

const FORWARDED_FOR_PATTERN = /for=([^;,\s]+)/i;

function parseForwardedHeader(header: string): string | null {
  // Forwarded: for=192.0.2.60;proto=http;by=203.0.113.43
  const match = header.match(FORWARDED_FOR_PATTERN);
  return match ? stripPort(unquoteHeaderValue(match[1].trim())) : null;
}

const QUOTE = "\"";

function unquoteHeaderValue(value: string): string {
  return value.startsWith(QUOTE) && value.endsWith(QUOTE) ? value.slice(1, -1) : value;
}

function shouldTrustForwarded(remoteAddress: string, trustProxy: TrustProxyMode): boolean {
  return trustProxy === "always" || (trustProxy === "auto" && isPrivateAddress(remoteAddress));
}

const FORWARDED_HEADERS = {
  forwarded: "forwarded",
  xForwardedFor: "x-forwarded-for"
} as const;

function getForwardedClientIp(req: IncomingMessage): string | null {
  return parseXForwardedFor(getHeaderValue(req.headers[FORWARDED_HEADERS.xForwardedFor]))
    ?? parseForwardedFor(getHeaderValue(req.headers[FORWARDED_HEADERS.forwarded]));
}

function getHeaderValue(value: IncomingMessage["headers"][string]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const X_FORWARDED_FOR_SEPARATOR = ",";

function parseXForwardedFor(value: string | undefined): string | null {
  const first = value?.split(X_FORWARDED_FOR_SEPARATOR)[0]?.trim();
  if (!first) return null;
  return toValidIp(stripPort(first));
}

function parseForwardedFor(value: string | undefined): string | null {
  if (!value) return null;
  return toValidIp(parseForwardedHeader(value));
}

const NUMERIC_PORT_PATTERN = /^\d+$/;

function stripPort(value: string): string {
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    return end === -1 ? value : value.slice(1, end);
  }
  const lastColon = value.lastIndexOf(":");
  return lastColon !== -1 && value.indexOf(":") === lastColon && NUMERIC_PORT_PATTERN.test(value.slice(lastColon + 1))
    ? value.slice(0, lastColon)
    : value;
}

const IPV4_OCTET_SEPARATOR = ".";

function toValidIp(value: string | null): string | null {
  const candidate = normalizeIp(value);
  return candidate && isValidIp(candidate) ? candidate : null;
}

const UNKNOWN_ADDRESS = "unknown";

function isPrivateAddress(value: string): boolean {
  if (value === UNKNOWN_ADDRESS) return false;
  const normalized = value.split("%")[0].toLowerCase();

  if (normalized.includes(".")) {
    return isPrivateIpv4(normalized);
  }

  return isPrivateIpv6(normalized);
}

function parseIpv4Octets(value: string): [number, number, number, number] | null {
  const parts = value.split(IPV4_OCTET_SEPARATOR);
  if (parts.length !== 4) return null;
  const nums = parts.map((part) => Number(part));
  return nums.every((num) => Number.isInteger(num) && num >= 0 && num <= 255)
    ? nums as [number, number, number, number]
    : null;
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

function isPrivateIpv4(value: string): boolean {
  const octets = parseIpv4Octets(value);
  if (!octets) return false;
  const [first, second] = octets;
  return isPrivateIpv4Prefix(first) || isPrivateIpv4Pair(first, second);
}

const PRIVATE_IPV4_SINGLE_FIRST_OCTETS: ReadonlySet<number> = new Set([
  PRIVATE_IPV4_RANGES.privateFirst,
  PRIVATE_IPV4_RANGES.localFirst
]);

function isPrivateIpv4Prefix(first: number): boolean {
  return PRIVATE_IPV4_SINGLE_FIRST_OCTETS.has(first);
}

const SECOND_PRIVATE_IPV4_RANGE = PRIVATE_IPV4_RANGES.privateSecondFirst;

function isPrivateIpv4Pair(first: number, second: number): boolean {
  if (first === PRIVATE_IPV4_RANGES.linkLocalFirst) return second === PRIVATE_IPV4_RANGES.linkLocalSecond;
  if (first === PRIVATE_IPV4_RANGES.siteLocalFirst) return second === PRIVATE_IPV4_RANGES.siteLocalSecond;
  if (first !== SECOND_PRIVATE_IPV4_RANGE) return false;
  return second >= PRIVATE_IPV4_RANGES.privateSecondMin && second <= PRIVATE_IPV4_RANGES.privateSecondMax;
}

const PRIVATE_IPV6_PREFIXES = ["fc", "fd", "fe8", "fe9", "fea", "feb"] as const;

function isPrivateIpv6(value: string): boolean {
  if (value === "::1") return true;
  return PRIVATE_IPV6_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function isValidIp(value: string): boolean {
  if (!value || value === UNKNOWN_ADDRESS) return false;
  const trimmed = value.trim();
  return isIP(trimmed.split("%")[0]) !== 0;
}

type ClientKeyOptions = {
  trustProxy?: TrustProxyMode;
};

export function getClientKey(req: IncomingMessage, options?: ClientKeyOptions): string {
  const remoteAddress = normalizeIp(req.socket.remoteAddress) ?? UNKNOWN_ADDRESS;
  if (!shouldTrustForwarded(remoteAddress, options?.trustProxy ?? "never")) {
    return remoteAddress;
  }

  return getForwardedClientIp(req) ?? remoteAddress;
}
