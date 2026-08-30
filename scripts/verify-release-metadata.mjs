#!/usr/bin/env node
/** Validates release identity and optionally extracts one bounded changelog section. */

import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);

const packagePaths = [
  "package.json",
  "apps/api/package.json",
  "apps/client/package.json",
  "packages/contracts/package.json",
  "packages/institutions/package.json",
];
const expectedPackageNames = {
  "package.json": "concourse-campus-kit",
  "apps/api/package.json": "@concourse/api",
  "apps/client/package.json": "@concourse/client",
  "packages/contracts/package.json": "@concourse/contracts",
  "packages/institutions/package.json": "@concourse/institutions",
};
const expectedExpoIdentity = {
  name: "Concourse",
  slug: "concourse-campus-kit",
  scheme: "concourse",
};
const expectedExpoAssets = {
  icon: "./assets/brand/concourse-icon.png",
  androidForegroundImage: "./assets/brand/concourse-adaptive.png",
  webFavicon: "./assets/brand/concourse-favicon.png",
};

function isAsciiDigit(character) {
  return character >= "0" && character <= "9";
}

function isAsciiLetter(character) {
  return (character >= "A" && character <= "Z") || (character >= "a" && character <= "z");
}

function isNumericIdentifier(value) {
  if (!value || ![...value].every(isAsciiDigit)) return false;
  return value === "0" || value[0] !== "0";
}

function isAlphanumericIdentifier(value) {
  let hasNonNumericCharacter = false;
  for (const character of value) {
    const isLetter = isAsciiLetter(character);
    if (!isAsciiDigit(character) && !isLetter && character !== "-") return false;
    if (isLetter || character === "-") hasNonNumericCharacter = true;
  }
  return value.length > 0 && hasNonNumericCharacter;
}

function parseCoreVersion(baseVersion) {
  const [major, minor, patch, ...extraBaseSegments] = baseVersion.split(".");
  if (extraBaseSegments.length > 0 || !isNumericIdentifier(major) || !isNumericIdentifier(minor) || !isNumericIdentifier(patch)) {
    return null;
  }
  return { major, minor, patch };
}

function isPrerelease(value) {
  return value.split(".").every((identifier) => isNumericIdentifier(identifier) || isAlphanumericIdentifier(identifier));
}

function parseSemVer(version) {
  if (typeof version !== "string") return null;
  const prereleaseStart = version.indexOf("-");
  const baseVersion = prereleaseStart === -1 ? version : version.slice(0, prereleaseStart);
  const prerelease = prereleaseStart === -1 ? undefined : version.slice(prereleaseStart + 1);
  const coreVersion = parseCoreVersion(baseVersion);
  if (!coreVersion || (prerelease !== undefined && !isPrerelease(prerelease))) return null;
  return { ...coreVersion, prerelease };
}

function isIsoDate(value) {
  return value.length === 10 && value[4] === "-" && value[7] === "-" &&
    [0, 1, 2, 3, 5, 6, 8, 9].every((index) => isAsciiDigit(value[index]));
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(path), "utf8"));
}

/** Evaluates Expo's executable config so release checks use the build-time source of truth. */
async function resolveExpoConfig(environment = {}) {
  const { EAS_BUILD_PROFILE: _ignoredBuildProfile, ...baseEnvironment } = process.env;
  const result = await execFileAsync(
    "pnpm",
    ["exec", "expo", "config", "--type", "public", "--json"],
    {
      cwd: resolve("apps/client"),
      env: { ...baseEnvironment, ...environment },
      maxBuffer: 1024 * 1024,
    },
  );
  return JSON.parse(result.stdout);
}

/** Confirms executable release validation rejects both current and retired template package identities. */
async function rejectsTemplateIdentifiers() {
  const templateIdentifiers = ["com.concoursecampuskit.mobile", "com.campusappkit.mobile"];
  for (const identifier of templateIdentifiers) {
    try {
      await resolveExpoConfig({
        EAS_BUILD_PROFILE: "production",
        EXPO_PUBLIC_BFF_BASE_URL: "https://api.example.test",
        INSTITUTION_ID: "example",
        MOBILE_ANDROID_PACKAGE: identifier,
        MOBILE_BUNDLE_IDENTIFIER: identifier,
      });
      return false;
    } catch {
      // Expected: the executable config rejects each template identity.
    }
  }
  return true;
}

function changelogSection(lines, version) {
  const headingPrefix = `## [${version}] - `;
  const start = lines.findIndex((line) => line.startsWith(headingPrefix));
  if (start === -1) return undefined;

  const date = lines[start].slice(headingPrefix.length);
  if (!isIsoDate(date)) return undefined;

  const nextHeading = lines.findIndex((line, index) => index > start && line.startsWith("## "));
  return lines.slice(start + 1, nextHeading === -1 ? lines.length : nextHeading);
}

function parseArguments(arguments_) {
  let version;
  let notesOutput;

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--") continue;
    if (argument === "--notes-output") {
      notesOutput = arguments_[index + 1];
      if (!notesOutput || notesOutput === "--") {
        throw new Error("--notes-output requires a file path");
      }
      index += 1;
      continue;
    }
    if (argument?.startsWith("--")) {
      throw new Error(`unknown option: ${argument}`);
    }
    if (version) {
      throw new Error(`unexpected argument: ${argument}`);
    }
    version = argument;
  }

  return { notesOutput, version };
}

const rootPackage = await readJson("package.json");
let parsedArguments;
try {
  parsedArguments = parseArguments(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

const expectedVersion = parsedArguments.version ?? rootPackage.version;
const semver = parseSemVer(expectedVersion);
const errors = [];

if (!semver) {
  errors.push(`release version must be SemVer without build metadata: ${expectedVersion}`);
}

for (const path of packagePaths) {
  const manifest = path === "package.json" ? rootPackage : await readJson(path);
  if (manifest.version !== expectedVersion) {
    errors.push(`${path} has version ${manifest.version ?? "<missing>"}; expected ${expectedVersion}`);
  }
  if (manifest.name !== expectedPackageNames[path]) {
    errors.push(`${path} has name ${manifest.name ?? "<missing>"}; expected ${expectedPackageNames[path]}`);
  }
}

if (semver) {
  let mobileConfig;
  try {
    mobileConfig = await resolveExpoConfig();
  } catch (error) {
    errors.push(`apps/client/app.config.ts could not be evaluated: ${error instanceof Error ? error.message : String(error)}`);
  }
  const expectedMobileVersion = `${semver.major}.${semver.minor}.${semver.patch}`;
  if (mobileConfig?.version !== expectedMobileVersion) {
    errors.push(
      `resolved Expo config has version ${mobileConfig?.version ?? "<missing>"}; ` +
        `expected platform-safe base version ${expectedMobileVersion}`,
    );
  }
  for (const [key, expectedValue] of Object.entries(expectedExpoIdentity)) {
    if (mobileConfig?.[key] !== expectedValue) {
      errors.push(
        `resolved Expo config has ${key} ${mobileConfig?.[key] ?? "<missing>"}; ` +
          `expected ${expectedValue}`,
      );
    }
  }
  if (mobileConfig?.icon !== expectedExpoAssets.icon) {
    errors.push(`resolved Expo config has icon ${mobileConfig?.icon ?? "<missing>"}; expected ${expectedExpoAssets.icon}`);
  }
  if (mobileConfig?.android?.adaptiveIcon?.foregroundImage !== expectedExpoAssets.androidForegroundImage) {
    errors.push("resolved Expo config does not use the Concourse Android adaptive icon");
  }
  if (mobileConfig?.android?.adaptiveIcon?.backgroundColor !== "#FFFFFF") {
    errors.push("resolved Expo config does not use the Concourse Android adaptive icon background");
  }
  if (mobileConfig?.web?.favicon !== expectedExpoAssets.webFavicon) {
    errors.push("resolved Expo config does not use the Concourse web favicon");
  }
  if (!(await rejectsTemplateIdentifiers())) {
    errors.push("apps/client/app.config.ts does not reject both Concourse and legacy template identifiers for production builds");
  }
}

const changelogLines = (await readFile(resolve("CHANGELOG.md"), "utf8")).split(/\r?\n/);
const section = changelogSection(changelogLines, expectedVersion);
if (!section) {
  errors.push(`CHANGELOG.md is missing "## [${expectedVersion}] - YYYY-MM-DD"`);
} else if (!section.some((line) => /^- \S/.test(line))) {
  errors.push(`CHANGELOG.md section for ${expectedVersion} has no release-note bullets`);
}

if (errors.length > 0) {
  for (const error of errors) process.stderr.write(`ERROR: ${error}\n`);
  process.exitCode = 1;
} else {
  if (parsedArguments.notesOutput && section) {
    const releaseNotes = `${section.join("\n").trim()}\n`;
    await writeFile(resolve(parsedArguments.notesOutput), releaseNotes, "utf8");
  }
  const channel = semver?.prerelease ? "prerelease" : "stable";
  process.stdout.write(`OK: release metadata is consistent for ${expectedVersion} (${channel})\n`);
}
