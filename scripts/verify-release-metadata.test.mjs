/** Verifies release identity checks and bounded release-note extraction in isolated fixtures. */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = fileURLToPath(new URL("./verify-release-metadata.mjs", import.meta.url));
const manifests = [
  "package.json",
  "apps/bff/package.json",
  "apps/mobile/package.json",
  "packages/institutions/package.json",
  "packages/shared/package.json",
];
const manifestNames = {
  "package.json": "concourse-campus-kit",
  "apps/bff/package.json": "@concourse/bff",
  "apps/mobile/package.json": "@concourse/mobile",
  "packages/institutions/package.json": "@concourse/institutions",
  "packages/shared/package.json": "@concourse/shared",
};

/** Creates the smallest repository layout needed to exercise release metadata validation. */
async function releaseFixture(version = "2.0.0-alpha.1") {
  const root = await mkdtemp(join(tmpdir(), "campus-release-metadata-"));
  for (const path of manifests) {
    const target = join(root, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify({ name: manifestNames[path], version })}\n`);
  }
  await writeFile(
    join(root, "apps/mobile/app.json"),
    `${JSON.stringify({ expo: {
      name: "Concourse", slug: "concourse-campus-kit", scheme: "concourse", version: "2.0.0",
      icon: "./assets/brand/concourse-icon.png",
      android: { adaptiveIcon: { foregroundImage: "./assets/brand/concourse-adaptive.png", backgroundColor: "#FFFFFF" } },
      web: { favicon: "./assets/brand/concourse-favicon.png" },
    } })}\n`,
  );
  await writeFile(
    join(root, "apps/mobile/app.config.ts"),
    'const LEGACY_TEMPLATE_PACKAGE = "com.campusappkit.mobile"\n' +
      'name: withDefault(config.name, "Concourse")\n' +
      'slug: withDefault(config.slug, "concourse-campus-kit")\n' +
      'scheme: withDefault(config.scheme, "concourse")\n' +
      'version: withDefault(config.version, "2.0.0")\n',
  );
  await writeFile(
    join(root, "CHANGELOG.md"),
    `# Changelog\n\n## [${version}] - 2026-07-15\n\n### Added\n\n- Alpha release\n`,
  );
  return root;
}

/** Executes the release verifier exactly as the package script and workflow do. */
function run(root, ...arguments_) {
  return spawnSync(process.execPath, [script, ...arguments_], {
    cwd: root,
    encoding: "utf8",
  });
}

test("accepts an aligned prerelease identity", async (context) => {
  const root = await releaseFixture();
  context.after(() => rm(root, { recursive: true, force: true }));

  const result = run(root, "2.0.0-alpha.1");

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /consistent.*prerelease/);
});

test("rejects tag and package drift", async (context) => {
  const root = await releaseFixture();
  context.after(() => rm(root, { recursive: true, force: true }));

  const result = run(root, "2.0.0-alpha.2");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /package\.json has version 2\.0\.0-alpha\.1/);
  assert.match(result.stderr, /CHANGELOG\.md is missing/);
});

test("rejects workspace and Expo identity drift", async (context) => {
  const root = await releaseFixture();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    join(root, "apps/mobile/package.json"),
    `${JSON.stringify({ name: "@wrong/mobile", version: "2.0.0-alpha.1" })}\n`,
  );
  await writeFile(
    join(root, "apps/mobile/app.json"),
    `${JSON.stringify({ expo: { name: "Concourse", slug: "wrong-slug", scheme: "concourse", version: "2.0.0" } })}\n`,
  );

  const result = run(root, "2.0.0-alpha.1");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /apps\/mobile\/package\.json has name @wrong\/mobile/);
  assert.match(result.stderr, /Expo slug wrong-slug; expected concourse-campus-kit/);
});

test("rejects build metadata that cannot be used as a Docker tag", async (context) => {
  const root = await releaseFixture();
  context.after(() => rm(root, { recursive: true, force: true }));

  const result = run(root, "2.0.0-alpha.1+ci.1");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /without build metadata/);
});

test("does not borrow release notes from a later unbracketed section", async (context) => {
  const root = await releaseFixture();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    join(root, "CHANGELOG.md"),
    "# Changelog\n\n## [2.0.0-alpha.1] - 2026-07-16\n\n" +
      "## Legacy development milestones\n\n- Historical change\n",
  );

  const result = run(root, "2.0.0-alpha.1");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /has no release-note bullets/);
});

test("writes only the requested release section", async (context) => {
  const root = await releaseFixture();
  const notes = join(root, "release-notes.md");
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    join(root, "CHANGELOG.md"),
    "# Changelog\n\n## [2.0.0-alpha.1] - 2026-07-16\n\n" +
      "### Added\n\n- Alpha release\n\n" +
      "## Legacy development milestones\n\n- Historical change\n",
  );

  const result = run(root, "2.0.0-alpha.1", "--notes-output", notes);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(notes, "utf8"), "### Added\n\n- Alpha release\n");
});
