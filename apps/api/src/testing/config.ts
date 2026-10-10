/** Builds validated BFF configuration for tests without reading the process environment. */

import { loadConfig, type BffConfig } from "../runtime/config";

/** Applies the same defaults the suite always used: the mockuni pack in mock events mode. */
export function createTestConfig(env: Record<string, string | undefined> = {}): BffConfig {
  return loadConfig({ INSTITUTION_ID: "mockuni", PUBLIC_EVENTS_MODE: "mock", ...env });
}
