import type { IncomingMessage } from "node:http";
import {
  resolveForwardedClientKey,
  type ClientKeyOptions
} from "./forwardedIdentity";

export type { ClientKeyOptions } from "./forwardedIdentity";

/** Derives the rate-limit key while applying the configured proxy-trust boundary. */
export function getClientKey(req: IncomingMessage, options?: ClientKeyOptions): string {
  return resolveForwardedClientKey(req, options ?? {});
}
