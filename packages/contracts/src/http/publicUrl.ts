/** Validates credential-free public HTTP(S) URLs for configuration and wire data. */

/** URL is available in every supported runtime; contracts do not require DOM typings. */
declare const URL: new (input: string) => {
  hostname: string;
  password: string;
  protocol: string;
  username: string;
};

const IPV4_BLOCKED_RANGES: ReadonlyArray<readonly [readonly number[], number]> = [
  [[0], 8],
  [[10], 8],
  [[100, 64], 10],
  [[127], 8],
  [[169, 254], 16],
  [[172, 16], 12],
  [[192, 0, 0], 24],
  [[192, 0, 2], 24],
  [[192, 88, 99], 24],
  [[192, 168], 16],
  [[198, 18], 15],
  [[198, 51, 100], 24],
  [[203, 0, 113], 24],
  [[224], 4],
  [[240], 4]
];

const IPV6_BLOCKED_PREFIXES: ReadonlyArray<readonly [string, number]> = [
  ["::", 96],
  ["::ffff:0:0", 96],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["100:0:0:1::", 64],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001::", 23],
  ["2001:2::", 48],
  ["2001:10::", 28],
  ["2001:20::", 28],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
  ["5f00::", 16]
];

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replaceAll("[", "").replaceAll("]", "").replace(/\.$/, "");
}

function parseIpv4(hostname: string): number[] | null {
  const parts = hostname.split(".");
  if (parts.length !== 4) return null;
  const numbers = parts.map((part) => Number(part));
  return numbers.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) ? numbers : null;
}

function ipv4MatchesPrefix(address: number[], prefix: readonly number[], prefixLength: number): boolean {
  const wholeOctets = Math.floor(prefixLength / 8);
  const remainingBits = prefixLength % 8;
  for (let index = 0; index < wholeOctets; index += 1) {
    if (address[index] !== prefix[index]) return false;
  }
  if (remainingBits === 0) return true;
  const mask = (0xff << (8 - remainingBits)) & 0xff;
  return (address[wholeOctets] & mask) === (prefix[wholeOctets] & mask);
}

function isBlockedIpv4(hostname: string): boolean {
  const address = parseIpv4(hostname);
  return address !== null && IPV4_BLOCKED_RANGES.some(([prefix, prefixLength]) =>
    ipv4MatchesPrefix(address, prefix, prefixLength)
  );
}

function expandIpv6(hostname: string): number[] | null {
  const parts = hostname.split("::");
  if (parts.length > 2) return null;
  const left = parts[0] ? parts[0].split(":") : [];
  const right = parts[1] ? parts[1].split(":") : [];
  const groups = [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right];
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/i.test(group))) return null;
  return groups.map((group) => Number.parseInt(group, 16));
}

function ipv6MatchesPrefix(address: number[], prefix: string, prefixLength: number): boolean {
  const prefixAddress = expandIpv6(prefix);
  if (!prefixAddress) return false;
  const wholeGroups = Math.floor(prefixLength / 16);
  const remainingBits = prefixLength % 16;
  for (let index = 0; index < wholeGroups; index += 1) {
    if (address[index] !== prefixAddress[index]) return false;
  }
  if (remainingBits === 0) return true;
  const mask = (0xffff << (16 - remainingBits)) & 0xffff;
  return (address[wholeGroups] & mask) === (prefixAddress[wholeGroups] & mask);
}

function isBlockedIpv6(hostname: string): boolean {
  const address = expandIpv6(hostname);
  return address !== null && IPV6_BLOCKED_PREFIXES.some(([prefix, prefixLength]) =>
    ipv6MatchesPrefix(address, prefix, prefixLength)
  );
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost"
    || hostname === "local"
    || hostname.endsWith(".localhost")
    || hostname.endsWith(".local")
    || (!hostname.includes(".") && !hostname.includes(":"));
}

/** Allows only public, credential-free HTTP(S) URLs safe for configured sources and event links. */
export function isPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;

    const hostname = normalizeHostname(url.hostname);
    return Boolean(hostname) && !isLocalHostname(hostname) && !isBlockedIpv4(hostname) && !isBlockedIpv6(hostname);
  } catch {
    return false;
  }
}
