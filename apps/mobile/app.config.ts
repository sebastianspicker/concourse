import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const bundleIdentifier =
    process.env.MOBILE_BUNDLE_IDENTIFIER ?? "com.campusappkit.mobile";
  const androidPackage = process.env.MOBILE_ANDROID_PACKAGE ?? bundleIdentifier;

  return {
    ...config,
    name: config.name ?? "Campus App Kit",
    slug: config.slug ?? "campus-app-kit",
    scheme: config.scheme ?? "campusapp",
    version: config.version ?? "0.1.0",
    plugins: config.plugins ?? ["expo-router"],
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
      bffBaseUrl: process.env.EXPO_PUBLIC_BFF_BASE_URL
    }
  };
};
