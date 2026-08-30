import { resolveBffBaseUrl } from "./bffConfig";

export function getBffBaseUrl(): string {
  return resolveBffBaseUrl();
}
