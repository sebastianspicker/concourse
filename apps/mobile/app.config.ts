import type { ExpoConfig, ConfigContext } from "expo/config";

function withDefault<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

function withCampusDefaults(config: ConfigContext["config"]): ExpoConfig {
  const bundleIdentifier =
    withDefault(process.env.MOBILE_BUNDLE_IDENTIFIER, "com.campusappkit.mobile");
  const androidPackage = withDefault(process.env.MOBILE_ANDROID_PACKAGE, bundleIdentifier);
  const buildProfile = process.env.EAS_BUILD_PROFILE;
  const institutionId = process.env.INSTITUTION_ID ?? process.env.EXPO_PUBLIC_INSTITUTION_ID;
  if ((buildProfile === "preview" || buildProfile === "production") && !institutionId) {
    throw new Error(`INSTITUTION_ID is required for ${buildProfile} builds`);
  }

  return {
    ...config,
    name: withDefault(config.name, "Campus App Kit"),
    slug: withDefault(config.slug, "campus-app-kit"),
    scheme: withDefault(config.scheme, "campusapp"),
    version: withDefault(config.version, "0.1.0"),
    plugins: withDefault(config.plugins, ["expo-router"]),
    web: {
      ...config.web,
      output: "server"
    },
    ios: {
      ...config.ios,
      bundleIdentifier
    },
    android: {
      ...config.android,
      package: androidPackage
    },
    extra: {
      ...config.extra,
      bffBaseUrl: process.env.EXPO_PUBLIC_BFF_BASE_URL,
      institutionId: institutionId ?? "example"
    }
  };
}

export default ({ config }: ConfigContext): ExpoConfig => withCampusDefaults(config);
