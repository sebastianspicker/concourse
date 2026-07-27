/** Exposes the resolved BFF base URL behind a single environment boundary. */
import { resolveBffBaseUrl } from "./bffConfig";

/** Exposes the validated BFF origin through the mobile environment boundary. */
export function getBffBaseUrl(): string {
  return resolveBffBaseUrl();
}
