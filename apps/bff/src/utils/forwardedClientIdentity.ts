/** Safely derives a client identity from forwarded headers and trusted proxies. */

import type { IncomingMessage } from "node:http";
import { isIP } from "node:net";
import { normalizeIp } from "./ipAddress";
import {
  createTrustedProxyMatcher,
  type TrustedProxyMatcher
} from "./trustedProxy";
import type { TrustProxyMode } from "./clientKey";

const UNKNOWN_ADDRESS = "unknown";
const NUMERIC_PORT_PATTERN = /^\d+$/;
const FORWARDED_FOR_PATTERN = /(?:^|;)\s*for=([^;,\s]+)/i;

export type ClientKeyOptions = {
  trustProxy?: TrustProxyMode;
  trustedProxies?: readonly string[];
  trustedProxyMatcher?: TrustedProxyMatcher;
};

/** Removes an optional forwarded address port before IP normalization. */
const stripPort = (value: string): string => {
  if (value.startsWith("[")) return value.slice(1, value.indexOf("]"));
  const firstColon = value.indexOf(":");
  const lastColon = value.lastIndexOf(":");
  return firstColon === lastColon && firstColon !== -1 && NUMERIC_PORT_PATTERN.test(value.slice(lastColon + 1))
    ? value.slice(0, lastColon)
    : value;
};

/** Accepts only normalized literal IPs from forwarded-header fields. */
const validIp = (value: string | null | undefined): string | null => {
  const candidate = normalizeIp(value);
  return candidate && isIP(candidate) !== 0 ? candidate : null;
};

const headerValue = (value: IncomingMessage["headers"][string]): string | undefined => Array.isArray(value) ? value[0] : value;

/** Rejects the whole forwarded chain when any parsed hop is not a valid IP literal. */
const validEntries = (entries: Array<string | null>): string[] | null =>
  entries.length > 0 && entries.every((entry): entry is string => entry !== null) ? entries : null;

/** Parses X-Forwarded-For into a wholly valid address chain. */
const parseXForwardedFor = (value: string | undefined): string[] | null =>
  value ? validEntries(value.split(",").map((entry) => validIp(stripPort(entry.trim())))) : null;

/** Parses RFC 7239 Forwarded entries without trusting malformed members. */
const parseForwardedFor = (value: string | undefined): string[] | null => {
  if (!value) return null;
  return validEntries(value.split(",").map((element) => {
    const match = element.trim().match(FORWARDED_FOR_PATTERN);
    const rawValue = match?.[1];
    const unquoted = rawValue?.startsWith('"') && rawValue.endsWith('"') ? rawValue.slice(1, -1) : rawValue;
    return validIp(unquoted && stripPort(unquoted));
  }));
};

/** Uses X-Forwarded-For when present, otherwise parses the RFC 7239 Forwarded header. */
const forwardedChain = (req: IncomingMessage): string[] | null => {
  const xForwardedFor = headerValue(req.headers["x-forwarded-for"]);
  return xForwardedFor === undefined ? parseForwardedFor(headerValue(req.headers.forwarded)) : parseXForwardedFor(xForwardedFor);
};

/** Walks a forwarded chain only while each intermediary is trusted. */
const resolveTrustedChain = (chain: string[], remoteAddress: string, matcher: TrustedProxyMatcher): string => {
  if (!matcher.isTrusted(remoteAddress)) return remoteAddress;
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    if (!matcher.isTrusted(chain[index])) return chain[index];
  }
  return remoteAddress;
};

/** Returns the normalized direct peer address when forwarded headers are untrusted. */
const socketAddress = (req: IncomingMessage): string => normalizeIp(req.socket.remoteAddress) || UNKNOWN_ADDRESS;

/** Defaults absent proxy configuration to distrust all forwarded client identities. */
const proxyMode = (options: ClientKeyOptions): TrustProxyMode => options.trustProxy === undefined ? "never" : options.trustProxy;

/** Reuses a supplied trusted-proxy matcher or compiles the configured CIDR ranges. */
const matcherFor = (options: ClientKeyOptions): TrustedProxyMatcher => {
  return options.trustedProxyMatcher === undefined
    ? createTrustedProxyMatcher(options.trustedProxies || [])
    : options.trustedProxyMatcher;
};

/** Chooses a client identity according to the explicit proxy-trust mode. */
const resolveProxyMode = (mode: TrustProxyMode, chain: string[] | null, remoteAddress: string, matcher: TrustedProxyMatcher): string => {
  if (!chain || mode === "never") return remoteAddress;
  if (mode === "always") return chain[chain.length - 1];
  return resolveTrustedChain(chain, remoteAddress, matcher);
};

/** Resolves a rate-limit identity, trusting forwarding headers only from approved peers. */
export const resolveForwardedClientKey = (req: IncomingMessage, options: ClientKeyOptions): string => {
  return resolveProxyMode(proxyMode(options), forwardedChain(req), socketAddress(req), matcherFor(options));
};
