/** Derives rate-limit client keys while honoring configured proxy trust. */

import type { IncomingMessage } from "node:http";
import {
  resolveForwardedClientKey,
  type ClientKeyOptions
} from "./forwardedClientIdentity";

export type TrustProxyMode = "never" | "always" | "trusted";

/** Resolves a rate-limit key from an explicit trusted-proxy chain. */
/** Derives the rate-limit key while applying the configured proxy-trust boundary. */
export function getClientKey(req: IncomingMessage, options?: ClientKeyOptions): string {
  return resolveForwardedClientKey(req, options ?? {});
}
