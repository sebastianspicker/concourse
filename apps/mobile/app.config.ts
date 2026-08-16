/** Expo application configuration with build-profile validation. */
import type { ExpoConfig, ConfigContext } from "expo/config";
import { normalizeBffBaseUrl } from "./src/utils/bffConfig";

const TEMPLATE_ANDROID_PACKAGE = "com.concoursecampuskit.mobile";
const TEMPLATE_IOS_BUNDLE_IDENTIFIER = "com.concoursecampuskit.mobile";
const LEGACY_TEMPLATE_PACKAGE = "com.campusappkit.mobile";
const CONCOURSE_ICON = "./assets/brand/concourse-icon.png";
const CONCOURSE_ADAPTIVE_ICON = "./assets/brand/concourse-adaptive.png";
const CONCOURSE_FAVICON = "./assets/brand/concourse-favicon.png";

/** Preserves explicit falsy configuration while supplying a default only for undefined values. */
function withDefault<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

/** Trims environment input and treats whitespace-only values as absent. */
function nonEmptyEnvironmentValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Rejects release builds early when a required environment value is blank or absent. */
function requiredEnvironmentValue(name: string, buildProfile: string): string {
  const value = nonEmptyEnvironmentValue(name);
  if (!value) {
    throw new Error(`${name} is required for ${buildProfile} builds`);
  }
  return value;
}

/** Produces the single release-build diagnostic for an invalid BFF origin. */
function invalidBffBaseUrl(buildProfile: string): never {
  throw new Error(`EXPO_PUBLIC_BFF_BASE_URL must be a credential-free HTTPS origin for ${buildProfile} builds`);
}

/** Validates and normalizes the release BFF origin before embedding it in Expo config. */
function requiredBffBaseUrl(buildProfile: string): string {
  const value = requiredEnvironmentValue("EXPO_PUBLIC_BFF_BASE_URL", buildProfile);
  try {
    return normalizeBffBaseUrl(value, false);
  } catch {
    invalidBffBaseUrl(buildProfile);
  }
}

/** Narrows EAS profiles that must reject development fallbacks. */
function isReleaseBuildProfile(
  buildProfile: string | undefined,
): buildProfile is "preview" | "production" {
  return buildProfile === "preview" || buildProfile === "production";
}

/** Uses the selected institution or permits the example pack only outside release builds. */
function resolveInstitutionId(buildProfile: string | undefined): string {
  const institutionId =
    nonEmptyEnvironmentValue("INSTITUTION_ID") ??
    nonEmptyEnvironmentValue("EXPO_PUBLIC_INSTITUTION_ID");
  if (!isReleaseBuildProfile(buildProfile)) return institutionId ?? "example";
  if (!institutionId) {
    throw new Error(`INSTITUTION_ID is required for ${buildProfile} builds`);
  }
  return institutionId;
}

/** Requires a validated BFF origin for release while preserving an optional development override. */
function resolveBffBaseUrl(buildProfile: string | undefined): string | undefined {
  return isReleaseBuildProfile(buildProfile)
    ? requiredBffBaseUrl(buildProfile)
    : nonEmptyEnvironmentValue("EXPO_PUBLIC_BFF_BASE_URL");
}

/** Prevents production packages from shipping missing or template bundle identifiers. */
function validateProductionIdentifiers(
  buildProfile: string | undefined,
  bundleIdentifier: string | undefined,
  androidPackage: string | undefined,
): void {
  if (buildProfile !== "production") return;
  if (!bundleIdentifier) {
    throw new Error("MOBILE_BUNDLE_IDENTIFIER is required for production builds");
  }
  if (!androidPackage) {
    throw new Error("MOBILE_ANDROID_PACKAGE is required for production builds");
  }
  if (
    bundleIdentifier === TEMPLATE_IOS_BUNDLE_IDENTIFIER ||
    androidPackage === TEMPLATE_ANDROID_PACKAGE ||
    bundleIdentifier === LEGACY_TEMPLATE_PACKAGE ||
    androidPackage === LEGACY_TEMPLATE_PACKAGE
  ) {
    throw new Error("Production builds must not use the Concourse template identifiers");
  }
}

/** Applies validated institution, service, and platform identifiers to Expo’s incoming config. */
function withCampusDefaults(config: ConfigContext["config"]): ExpoConfig {
  const explicitBundleIdentifier = nonEmptyEnvironmentValue("MOBILE_BUNDLE_IDENTIFIER");
  const explicitAndroidPackage = nonEmptyEnvironmentValue("MOBILE_ANDROID_PACKAGE");
  const buildProfile = process.env.EAS_BUILD_PROFILE;
  const staticDemo = process.env.CONCOURSE_STATIC_DEMO === "1";
  const institutionId = resolveInstitutionId(buildProfile);
  const bffBaseUrl = resolveBffBaseUrl(buildProfile);
  validateProductionIdentifiers(
    buildProfile,
    explicitBundleIdentifier,
    explicitAndroidPackage,
  );

  const bundleIdentifier = explicitBundleIdentifier ?? TEMPLATE_IOS_BUNDLE_IDENTIFIER;
  const androidPackage = explicitAndroidPackage ?? bundleIdentifier;

  return {
    ...config,
    name: withDefault(config.name, "Concourse"),
    slug: withDefault(config.slug, "concourse-campus-kit"),
    scheme: withDefault(config.scheme, "concourse"),
    icon: withDefault(config.icon, CONCOURSE_ICON),
    version: withDefault(config.version, "1.2.0"),
    plugins: withDefault(config.plugins, ["expo-router"]),
    web: {
      ...config.web,
      output: staticDemo ? "static" : "server",
      favicon: withDefault(config.web?.favicon, CONCOURSE_FAVICON),
    },
    experiments: {
      ...config.experiments,
      ...(staticDemo ? { baseUrl: "/concourse" } : {}),
    },
    ios: {
      ...config.ios,
      bundleIdentifier
    },
    android: {
      ...config.android,
      package: androidPackage,
      adaptiveIcon: withDefault(config.android?.adaptiveIcon, {
        foregroundImage: CONCOURSE_ADAPTIVE_ICON,
        backgroundColor: "#FFFFFF",
      })
    },
    extra: {
      ...config.extra,
      bffBaseUrl,
      institutionId,
      staticDemo,
    }
  };
}

export default ({ config }: ConfigContext): ExpoConfig => withCampusDefaults(config);
