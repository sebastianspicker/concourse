/**
 * @param {import("expo/config").ExpoConfig} config
 * @returns {import("expo/config").ExpoConfig}
 */
function getExpoDefaults(config) {
  const bundleIdentifier = valueOr(process.env.MOBILE_BUNDLE_IDENTIFIER, "com.campusappkit.mobile");
  const androidPackage = valueOr(process.env.MOBILE_ANDROID_PACKAGE, bundleIdentifier);
  return {
    ...config,
    ...getAppIdentity(config),
    web: { ...config.web, output: "server" },
    ios: { ...config.ios, bundleIdentifier },
    android: { ...config.android, package: androidPackage },
    extra: { ...config.extra, bffBaseUrl: process.env.EXPO_PUBLIC_BFF_BASE_URL }
  };
}

/** @param {import("expo/config").ExpoConfig} config */
function getAppIdentity(config) {
  return {
    name: valueOr(config.name, "Campus App Kit"),
    slug: valueOr(config.slug, "campus-app-kit"),
    scheme: valueOr(config.scheme, "campusapp"),
    version: valueOr(config.version, "0.1.0"),
    plugins: valueOr(config.plugins, ["expo-router"])
  };
}

function valueOr(value, fallback) {
  return value === null || value === undefined ? fallback : value;
}

module.exports = { getExpoDefaults };
