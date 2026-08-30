const IPV6_MAPPED_IPV4_PREFIX = "::ffff:";

export const normalizeIp = (value: string | null | undefined, mapIpv4Mapped = true): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const normalized = trimmed.split("%")[0].toLowerCase();
  return mapIpv4Mapped && normalized.startsWith(IPV6_MAPPED_IPV4_PREFIX)
    ? normalized.slice(IPV6_MAPPED_IPV4_PREFIX.length)
    : normalized;
};
