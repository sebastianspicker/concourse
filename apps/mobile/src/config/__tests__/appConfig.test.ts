/** Verifies build profiles reject missing institution, BFF, and production identifier settings. */
import type { ConfigContext } from "expo/config";
import { afterEach, describe, expect, it } from "vitest";
import createConfig from "../../../app.config";

const environmentKeys = [
  "EAS_BUILD_PROFILE",
  "EXPO_PUBLIC_BFF_BASE_URL",
  "EXPO_PUBLIC_INSTITUTION_ID",
  "INSTITUTION_ID",
  "MOBILE_ANDROID_PACKAGE",
  "MOBILE_BUNDLE_IDENTIFIER",
] as const;

const originalEnvironment = new Map(
  environmentKeys.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const key of environmentKeys) {
    const originalValue = originalEnvironment.get(key);
    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  }
});

/** Restores the process environment and module cache between app-config test cases. */
function resetBuildEnvironment(): void {
  for (const key of environmentKeys) delete process.env[key];
}

function setProductionEnvironment(overrides: Partial<Record<(typeof environmentKeys)[number], string>> = {}): void {
  resetBuildEnvironment();
  Object.assign(process.env, {
    EAS_BUILD_PROFILE: "production",
    INSTITUTION_ID: "example",
    EXPO_PUBLIC_BFF_BASE_URL: "https://campus.example.test",
    ...overrides,
  });
}

function resolveConfig() {
  return createConfig({ config: {} } as ConfigContext);
}

describe("mobile release configuration", () => {
  it("requires an HTTP(S) BFF URL for preview builds", () => {
    resetBuildEnvironment();
    process.env.EAS_BUILD_PROFILE = "preview";
    process.env.INSTITUTION_ID = "example";

    expect(resolveConfig).toThrow(
      "EXPO_PUBLIC_BFF_BASE_URL is required for preview builds",
    );

    process.env.EXPO_PUBLIC_BFF_BASE_URL = "file:///tmp/campus";
    expect(resolveConfig).toThrow(
      "EXPO_PUBLIC_BFF_BASE_URL must be a valid HTTP(S) URL for preview builds",
    );
  });

  it("accepts a fully configured preview build", () => {
    resetBuildEnvironment();
    process.env.EAS_BUILD_PROFILE = "preview";
    process.env.INSTITUTION_ID = "example";
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "https://campus.example.test/";

    const config = resolveConfig();

    expect(config.extra).toMatchObject({
      bffBaseUrl: "https://campus.example.test",
      institutionId: "example",
    });
  });

  it("requires explicit production identifiers", () => {
    setProductionEnvironment();

    expect(resolveConfig).toThrow(
      "MOBILE_BUNDLE_IDENTIFIER is required for production builds",
    );

    process.env.MOBILE_BUNDLE_IDENTIFIER = "edu.example.campus";
    expect(resolveConfig).toThrow(
      "MOBILE_ANDROID_PACKAGE is required for production builds",
    );
  });

  it("rejects template identifiers for production builds", () => {
    setProductionEnvironment({
      MOBILE_BUNDLE_IDENTIFIER: "com.concoursecampuskit.mobile",
      MOBILE_ANDROID_PACKAGE: "edu.example.campus",
    });

    expect(resolveConfig).toThrow(
      "Production builds must not use the Concourse template identifiers",
    );
  });

  it("rejects the legacy template identifier for production builds", () => {
    setProductionEnvironment({
      MOBILE_BUNDLE_IDENTIFIER: "edu.example.campus",
      MOBILE_ANDROID_PACKAGE: "com.campusappkit.mobile",
    });

    expect(resolveConfig).toThrow(
      "Production builds must not use the Concourse template identifiers",
    );
  });

  it("accepts a fully configured production build", () => {
    setProductionEnvironment({
      MOBILE_BUNDLE_IDENTIFIER: "edu.example.campus",
      MOBILE_ANDROID_PACKAGE: "edu.example.campus",
    });

    const config = resolveConfig();

    expect(config.ios?.bundleIdentifier).toBe("edu.example.campus");
    expect(config.android?.package).toBe("edu.example.campus");
    expect(config.extra?.bffBaseUrl).toBe("https://campus.example.test");
  });

  it("uses the Concourse identity outside release builds", () => {
    resetBuildEnvironment();

    expect(resolveConfig()).toMatchObject({
      name: "Concourse",
      slug: "concourse-campus-kit",
      scheme: "concourse",
      icon: "./assets/brand/concourse-icon.png",
      web: { favicon: "./assets/brand/concourse-favicon.png" },
      ios: { bundleIdentifier: "com.concoursecampuskit.mobile" },
      android: {
        package: "com.concoursecampuskit.mobile",
        adaptiveIcon: {
          foregroundImage: "./assets/brand/concourse-adaptive.png",
          backgroundColor: "#FFFFFF",
        },
      },
    });
  });
});
