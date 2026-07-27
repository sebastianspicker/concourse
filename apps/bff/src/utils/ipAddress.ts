/** Normalizes IP address text for proxy matching and client keys. */

const IPV6_MAPPED_IPV4_PREFIX = "::ffff:";

/** Converts IPv4-mapped IPv6 text to its IPv4 form for stable proxy comparisons. */
export const normalizeIp = (value: string | null | undefined, mapIpv4Mapped = true): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const normalized = trimmed.split("%")[0].toLowerCase();
  return mapIpv4Mapped && normalized.startsWith(IPV6_MAPPED_IPV4_PREFIX)
    ? normalized.slice(IPV6_MAPPED_IPV4_PREFIX.length)
    : normalized;
};
