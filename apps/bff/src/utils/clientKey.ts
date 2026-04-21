import type { IncomingMessage } from "node:http";
import { isIP } from "node:net";
import type { TrustProxyMode } from "../config/env";

function normalizeIp(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Strip IPv6 zone IDs (e.g., "fe80::1%eth0" -> "fe80::1") for consistent comparison
  const withoutZone = trimmed.split("%")[0];
  const withoutMappedV6 = withoutZone.startsWith("::ffff:")
    ? withoutZone.slice("::ffff:".length)
    : withoutZone;
  return withoutMappedV6;
}

function parseForwardedHeader(header: string): string | null {
  // Forwarded: for=192.0.2.60;proto=http;by=203.0.113.43
  const match = header.match(/for=([^;,\s]+)/i);
  if (!match) return null;
  let value = match[1].trim();
  if (value.startsWith("\"") && value.endsWith("\"")) {
    value = value.slice(1, -1);
  }
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    if (end > 1) {
      return value.slice(1, end);
    }
  }
  // host:port (IPv4 or hostname) – port is numeric suffix; do not split IPv6 on ":"
  const lastColon = value.lastIndexOf(":");
  if (lastColon !== -1) {
    const after = value.slice(lastColon + 1);
    if (/^\d+$/.test(after)) return value.slice(0, lastColon);
  }
  return value;
}

type ClientKeyOptions = {
  trustProxy?: TrustProxyMode;
};

export function getClientKey(req: IncomingMessage, options?: ClientKeyOptions): string {
  const remoteAddress = normalizeIp(req.socket.remoteAddress) ?? "unknown";
  const trustProxy = options?.trustProxy ?? "auto";
  const canTrustForwarded =
    trustProxy === "always" || (trustProxy === "auto" && isPrivateAddress(remoteAddress));

  if (canTrustForwarded) {
    const xff = req.headers["x-forwarded-for"];
    const xffValue = Array.isArray(xff) ? xff[0] : xff;
    if (typeof xffValue === "string" && xffValue.trim()) {
      const first = xffValue.split(",")[0].trim();
      // Handle IP:port or [IPv6]:port
      let ipPart = first;
      if (first.startsWith("[")) {
        const end = first.indexOf("]");
        if (end !== -1) ipPart = first.slice(1, end);
      } else {
        const lastColon = first.lastIndexOf(":");
        if (lastColon !== -1 && first.indexOf(":") === lastColon) {
          // Likely IPv4:port
          ipPart = first.slice(0, lastColon);
        }
      }
      const candidate = normalizeIp(ipPart);
      if (candidate && isValidIp(candidate)) return candidate;
    }

    const forwarded = req.headers["forwarded"];
    const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (typeof forwardedValue === "string") {
      const parsed = parseForwardedHeader(forwardedValue);
      const candidate = normalizeIp(parsed);
      if (candidate && isValidIp(candidate)) return candidate;
    }
  }

  return remoteAddress;
}

function isPrivateAddress(value: string): boolean {
  if (value === "unknown") return false;
  const normalized = value.split("%")[0].toLowerCase();

  if (normalized.includes(".")) {
    return isPrivateIpv4(normalized);
  }

  return isPrivateIpv6(normalized);
}

function isPrivateIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  const nums = parts.map((part) => Number(part));
  if (nums.some((num) => !Number.isInteger(num) || num < 0 || num > 255)) return false;

  const [first, second] = nums;
  if (first === 10) return true;
  if (first === 127) return true;
  if (first === 169 && second === 254) return true;
  if (first === 192 && second === 168) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  return false;
}

function isPrivateIpv6(value: string): boolean {
  if (value === "::1") return true;
  if (value.startsWith("fc") || value.startsWith("fd")) return true;
  if (value.startsWith("fe8") || value.startsWith("fe9")) return true;
  if (value.startsWith("fea") || value.startsWith("feb")) return true;
  return false;
}

function isValidIp(value: string): boolean {
  if (!value || value === "unknown") return false;
  const trimmed = value.trim();
  return isIP(trimmed.split("%")[0]) !== 0;
}
