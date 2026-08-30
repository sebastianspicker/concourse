function normalizeBffBaseUrl(input, isDevelopment) {
  const trimmed = input.trim();
  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`Invalid BFF base URL: ${input}`);
  }

  assertCredentialFreeBffUrl(url);
  assertOriginOnlyBffUrl(url);
  if (isPermittedDevelopmentBffUrl(url, isDevelopment)) return url.origin;
  if (url.protocol !== "https:") throw new Error("BFF base URL must use HTTPS outside loopback development");
  if (!isDevelopment && isReleaseRestrictedHost(url.hostname)) {
    throw new Error("BFF base URL must not use a localhost or special-use IP address in release builds");
  }
  return url.origin;
}

function normalizeReleaseBffBaseUrl(input) {
  return normalizeBffBaseUrl(input, false);
}

function assertCredentialFreeBffUrl(url) {
  if (url.username || url.password) throw new Error("BFF base URL must not include credentials");
}

function assertOriginOnlyBffUrl(url) {
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("BFF base URL must be an origin without a path, query, or fragment");
  }
}

function isPermittedDevelopmentBffUrl(url, isDevelopment) {
  return url.protocol === "http:" && isDevelopment && isLoopbackHost(url.hostname);
}

function isLoopbackHost(hostname) {
  const normalized = normalizeHostname(hostname);
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function isReleaseRestrictedHost(hostname) {
  const normalized = normalizeHostname(hostname);
  return normalized === "localhost" || normalized.endsWith(".localhost") ||
    isSpecialUseIpv4Address(normalized) || isSpecialUseIpv6Address(normalized);
}

function normalizeHostname(hostname) {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

const SPECIAL_USE_IPV4_RANGES = [
  [0x00000000, 0x00ffffff], [0x0a000000, 0x0affffff], [0x64400000, 0x647fffff],
  [0x7f000000, 0x7fffffff], [0xa9fe0000, 0xa9feffff], [0xac100000, 0xac1fffff],
  [0xc0000000, 0xc000ffff], [0xc0020000, 0xc002ffff], [0xc0580000, 0xc058ffff],
  [0xc0a80000, 0xc0a8ffff], [0xc6120000, 0xc613ffff], [0xc6330000, 0xc633ffff],
  [0xcb007100, 0xcb0071ff], [0xe0000000, 0xffffffff],
];

/** Classifies RFC special-use IPv4 blocks after URL parsing has normalized alternate notation. */
function isSpecialUseIpv4Address(hostname) {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }
  const address = octets.reduce((value, octet) => value * 256 + octet, 0);
  return SPECIAL_USE_IPV4_RANGES.some(([start, end]) => address >= start && address <= end);
}

/** Classifies loopback, unique-local, link-local, and IPv4-mapped IPv6 literals. */
function isSpecialUseIpv6Address(hostname) {
  if (!hostname.includes(":")) return false;
  return hostname === "::" || hostname === "::1" || hostname.startsWith("fc") ||
    hostname.startsWith("fd") || /^fe[89ab]/.test(hostname) || hostname.startsWith("::ffff:");
}

module.exports = {
  assertCredentialFreeBffUrl,
  assertOriginOnlyBffUrl,
  isLoopbackHost,
  isPermittedDevelopmentBffUrl,
  isReleaseRestrictedHost,
  isSpecialUseIpv4Address,
  isSpecialUseIpv6Address,
  normalizeBffBaseUrl,
  normalizeHostname,
  normalizeReleaseBffBaseUrl,
};
