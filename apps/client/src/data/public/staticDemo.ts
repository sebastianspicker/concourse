/** Exposes the build-time static-demo flag through Expo's runtime configuration. */
import Constants from "expo-constants";

/** Returns true only for the fixture-backed GitHub Pages build. */
export function isStaticDemo(): boolean {
  const extra = Constants.expoConfig?.extra as { staticDemo?: unknown } | undefined;
  return extra?.staticDemo === true;
}
