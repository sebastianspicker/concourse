#!/usr/bin/env node
/** Validates release identity and optionally extracts one bounded changelog section. */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packagePaths = [
  "package.json",
  "apps/bff/package.json",
  "apps/mobile/package.json",
  "packages/institutions/package.json",
  "packages/shared/package.json",
];
const expectedPackageNames = {
  "package.json": "concourse-campus-kit",
  "apps/bff/package.json": "@concourse/bff",
  "apps/mobile/package.json": "@concourse/mobile",
  "packages/institutions/package.json": "@concourse/institutions",
  "packages/shared/package.json": "@concourse/shared",
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

const numericIdentifier = "(?:0|[1-9]\\d*)";
const alphanumericIdentifier = "(?:\\d*[A-Za-z-][0-9A-Za-z-]*)";
const prereleaseIdentifier = `(?:${numericIdentifier}|${alphanumericIdentifier})`;
const semverPattern = new RegExp(
  `^(${numericIdentifier})\\.(${numericIdentifier})\\.(${numericIdentifier})` +
    `(?:-(${prereleaseIdentifier}(?:\\.${prereleaseIdentifier})*))?$`,
);

/** Reads repository JSON using the current working directory as the release root. */
async function readJson(path) {
  return JSON.parse(await readFile(resolve(path), "utf8"));
}

/** Returns only the requested dated release section, stopping at the next level-two heading. */
function changelogSection(lines, version) {
  const headingPrefix = `## [${version}] - `;
  const start = lines.findIndex((line) => line.startsWith(headingPrefix));
  if (start === -1) return undefined;

  const date = lines[start].slice(headingPrefix.length);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;

  const nextHeading = lines.findIndex((line, index) => index > start && line.startsWith("## "));
  return lines.slice(start + 1, nextHeading === -1 ? lines.length : nextHeading);
}

/** Parses the release version and optional release-notes output without accepting stray flags. */
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
const semver = semverPattern.exec(expectedVersion);
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
  const mobileConfig = await readJson("apps/mobile/app.json");
  const expectedMobileVersion = `${semver[1]}.${semver[2]}.${semver[3]}`;
  if (mobileConfig.expo?.version !== expectedMobileVersion) {
    errors.push(
      `apps/mobile/app.json has Expo version ${mobileConfig.expo?.version ?? "<missing>"}; ` +
        `expected platform-safe base version ${expectedMobileVersion}`,
    );
  }
  for (const [key, expectedValue] of Object.entries(expectedExpoIdentity)) {
    if (mobileConfig.expo?.[key] !== expectedValue) {
      errors.push(
        `apps/mobile/app.json has Expo ${key} ${mobileConfig.expo?.[key] ?? "<missing>"}; ` +
          `expected ${expectedValue}`,
      );
    }
  }
  if (mobileConfig.expo?.icon !== expectedExpoAssets.icon) {
    errors.push(`apps/mobile/app.json has Expo icon ${mobileConfig.expo?.icon ?? "<missing>"}; expected ${expectedExpoAssets.icon}`);
  }
  if (mobileConfig.expo?.android?.adaptiveIcon?.foregroundImage !== expectedExpoAssets.androidForegroundImage) {
    errors.push("apps/mobile/app.json does not use the Concourse Android adaptive icon");
  }
  if (mobileConfig.expo?.android?.adaptiveIcon?.backgroundColor !== "#FFFFFF") {
    errors.push("apps/mobile/app.json does not use the Concourse Android adaptive icon background");
  }
  if (mobileConfig.expo?.web?.favicon !== expectedExpoAssets.webFavicon) {
    errors.push("apps/mobile/app.json does not use the Concourse web favicon");
  }
  const dynamicConfig = await readFile(resolve("apps/mobile/app.config.ts"), "utf8");
  const expectedFallback = `version: withDefault(config.version, "${expectedMobileVersion}")`;
  if (!dynamicConfig.includes(expectedFallback)) {
    errors.push(`apps/mobile/app.config.ts does not use fallback version ${expectedMobileVersion}`);
  }
  for (const [key, expectedValue] of Object.entries(expectedExpoIdentity)) {
    const expectedDynamicFallback = `${key}: withDefault(config.${key}, "${expectedValue}")`;
    if (!dynamicConfig.includes(expectedDynamicFallback)) {
      errors.push(`apps/mobile/app.config.ts does not use fallback ${key} ${expectedValue}`);
    }
  }
  if (!dynamicConfig.includes('const LEGACY_TEMPLATE_PACKAGE = "com.campusappkit.mobile"')) {
    errors.push("apps/mobile/app.config.ts does not reject the legacy template identifier");
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
  const channel = semver?.[4] ? "prerelease" : "stable";
  process.stdout.write(`OK: release metadata is consistent for ${expectedVersion} (${channel})\n`);
}
