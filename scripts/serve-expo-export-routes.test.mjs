/** Characterizes the pure Expo export route resolver independently from the HTTP facade. */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { createExpoExportFileResolver } from "./serve-expo-export-routes.mjs";

function createFixture(manifest) {
  const root = mkdtempSync(join(tmpdir(), "concourse-export-routes-"));
  const serverRoot = join(root, "server");
  const clientRoot = join(root, "client");
  mkdirSync(join(serverRoot, "_expo"), { recursive: true });
  mkdirSync(clientRoot, { recursive: true });
  if (manifest !== undefined) writeFileSync(join(serverRoot, "_expo", "routes.json"), manifest);
  return { root, serverRoot, clientRoot };
}

function writeFile(root, path, content = path) {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  return realpathSync(file);
}

function writePage(serverRoot, page, content = page) {
  return writeFile(serverRoot, `${page.replace(/^\//, "")}.html`, content);
}

function cleanup(fixture) {
  rmSync(fixture.root, { recursive: true, force: true });
}

function createPathResolver(fixture) {
  const resolveFile = createExpoExportFileResolver(fixture);
  return (pathname) => resolveFile(pathname)?.streamPath ?? null;
}

test("rejects outside-root traversal and non-file direct candidates", (context) => {
  const fixture = createFixture();
  context.after(() => cleanup(fixture));
  const sibling = join(fixture.root, "server-sibling", "secret.html");
  writeFile(fixture.root, "server-sibling/secret.html", "outside");
  mkdirSync(join(fixture.serverRoot, "directory.html"));
  symlinkSync("missing-target", join(fixture.serverRoot, "broken.html"));
  const resolveFile = createPathResolver(fixture);

  assert.equal(resolveFile("/../../server-sibling/secret.html"), null);
  assert.ok(existsSync(sibling));
  assert.equal(resolveFile("/missing"), null);
  assert.equal(resolveFile("/directory.html"), null);
  assert.equal(resolveFile("/broken.html"), null);
});

test("uses canonical containment for direct, manifest, and client candidates", (context) => {
  const fixture = createFixture(JSON.stringify({
    htmlRoutes: [
      { namedRegex: "ignored", page: "/assets/[id]" },
      { namedRegex: "ignored", page: "/missing-route/[id]" },
    ],
  }));
  context.after(() => cleanup(fixture));
  const outsideFile = writeFile(fixture.root, "outside/secret.html", "outside");
  const outsideDirectory = dirname(outsideFile);
  const serverTarget = writeFile(fixture.serverRoot, "target/inside.html", "inside");
  const clientTarget = writeFile(fixture.clientRoot, "owned/asset.js", "inside client");
  const bare = writeFile(fixture.serverRoot, "bare", "bare direct");
  const extension = writeFile(fixture.serverRoot, "extension.html", "extension direct");
  writePage(fixture.serverRoot, "/assets/[id]", "server-only assets route");
  mkdirSync(join(fixture.clientRoot, "_expo", "static"), { recursive: true });
  mkdirSync(join(fixture.clientRoot, "assets"), { recursive: true });
  symlinkSync(outsideFile, join(fixture.serverRoot, "server-final-outside.html"));
  symlinkSync(outsideDirectory, join(fixture.serverRoot, "server-intermediate-outside"));
  symlinkSync("missing-target", join(fixture.serverRoot, "server-broken.html"));
  symlinkSync(serverTarget, join(fixture.serverRoot, "server-final-inside.html"));
  symlinkSync(join(fixture.serverRoot, "target"), join(fixture.serverRoot, "server-intermediate-inside"));
  symlinkSync(outsideFile, join(fixture.clientRoot, "_expo", "static", "client-final-outside.js"));
  symlinkSync(outsideDirectory, join(fixture.clientRoot, "assets", "client-intermediate-outside"));
  symlinkSync(clientTarget, join(fixture.clientRoot, "_expo", "static", "client-final-inside.js"));
  const resolveResult = createExpoExportFileResolver(fixture);
  const resolveFile = (pathname) => resolveResult(pathname)?.streamPath ?? null;

  assert.equal(resolveFile("/../../server-sibling/secret.html"), null);
  assert.equal(resolveFile("/server-final-outside.html"), null);
  assert.equal(resolveFile("/server-intermediate-outside/secret.html"), null);
  assert.equal(resolveFile("/server-broken.html"), null);
  assert.equal(resolveFile("/_expo/static/client-final-outside.js"), null);
  assert.equal(resolveFile("/assets/client-intermediate-outside/secret.html"), null);
  assert.equal(resolveFile("/server-final-inside.html"), serverTarget);
  assert.equal(resolveFile("/server-intermediate-inside/inside.html"), serverTarget);
  assert.equal(resolveFile("/_expo/static/client-final-inside.js"), clientTarget);
  assert.equal(resolveFile("/assets/missing"), null);
  assert.equal(resolveFile("/bare"), bare);
  assert.equal(resolveFile("/extension"), extension);
  assert.equal(resolveFile("/missing-route/value"), null);
  assert.deepEqual(resolveResult("/extension"), {
    streamPath: extension,
    selectedPath: join(realpathSync(fixture.serverRoot), "extension.html"),
  });
});

test("treats unavailable or malformed manifests as no routes and snapshots startup metadata", (context) => {
  for (const manifest of [undefined, "{", JSON.stringify({ htmlRoutes: {} })]) {
    const fixture = createFixture(manifest);
    context.after(() => cleanup(fixture));
    writePage(fixture.serverRoot, "/events/[id]");
    assert.equal(createPathResolver(fixture)("/events/open-day"), null);
  }

  const fixture = createFixture(JSON.stringify({
    htmlRoutes: [{ namedRegex: "^/different$", page: "/events/[id]" }],
  }));
  context.after(() => cleanup(fixture));
  const expected = writePage(fixture.serverRoot, "/events/[id]");
  const resolveFile = createPathResolver(fixture);
  writeFileSync(join(fixture.serverRoot, "_expo", "routes.json"), JSON.stringify({ htmlRoutes: [] }));
  assert.equal(resolveFile("/events/open-day"), expected);
});

test("accepts opaque regex strings without compiling them and rejects non-string metadata", (context) => {
  const fixture = createFixture(JSON.stringify({
    htmlRoutes: [
      { namedRegex: "(", page: "/invalid/[id]" },
      { namedRegex: "^/not-this-path$", page: "/opaque/[id]" },
      { namedRegex: 42, page: "/rejected/[id]" },
    ],
  }));
  context.after(() => cleanup(fixture));
  const invalid = writePage(fixture.serverRoot, "/invalid/[id]");
  const opaque = writePage(fixture.serverRoot, "/opaque/[id]");
  writePage(fixture.serverRoot, "/rejected/[id]");
  const resolveFile = createPathResolver(fixture);

  assert.equal(resolveFile("/invalid/value"), invalid);
  assert.equal(resolveFile("/opaque/value"), opaque);
  assert.equal(resolveFile("/rejected/value"), null);
});

test("matches static, parameter, catch-all, optional catch-all, groups, and indexes", (context) => {
  const fixture = createFixture(JSON.stringify({
    htmlRoutes: [
      { namedRegex: "ignored", page: "/about" },
      { namedRegex: "ignored", page: "/events/[id]" },
      { namedRegex: "ignored", page: "/schedule/[...slug]" },
      { namedRegex: "ignored", page: "/rooms/[[...slug]]" },
      { namedRegex: "ignored", page: "/(tabs)/news/index" },
    ],
  }));
  context.after(() => cleanup(fixture));
  const about = writePage(fixture.serverRoot, "/about");
  const event = writePage(fixture.serverRoot, "/events/[id]");
  const schedule = writePage(fixture.serverRoot, "/schedule/[...slug]");
  const rooms = writePage(fixture.serverRoot, "/rooms/[[...slug]]");
  const news = writePage(fixture.serverRoot, "/(tabs)/news/index");
  const resolveFile = createPathResolver(fixture);

  assert.equal(resolveFile("/about"), about);
  assert.equal(resolveFile("/events/open-day"), event);
  assert.equal(resolveFile("/schedule/day/one"), schedule);
  assert.equal(resolveFile("/schedule"), null);
  assert.equal(resolveFile("/rooms"), rooms);
  assert.equal(resolveFile("/rooms/faculty/lobby"), rooms);
  assert.equal(resolveFile("/news"), news);
});

test("preserves precedence, candidate order, page candidates, manifest order, and client exclusivity", (context) => {
  const fixture = createFixture(JSON.stringify({
    htmlRoutes: [
      { namedRegex: "ignored", page: "/(fallback)/index" },
      { namedRegex: "ignored", page: "/manifest/first" },
      { namedRegex: "ignored", page: "/manifest/[id]" },
      { namedRegex: "ignored", page: "/priority/[[...slug]]" },
      { namedRegex: "ignored", page: "/pages/[id]/index" },
      { namedRegex: "ignored", page: "/_expo/static/[id]" },
    ],
  }));
  context.after(() => cleanup(fixture));
  const home = writeFile(fixture.serverRoot, "(tabs)/index.html", "home");
  writePage(fixture.serverRoot, "/(fallback)/index", "manifest root");
  const manifestFirst = writePage(fixture.serverRoot, "/manifest/first", "first");
  writePage(fixture.serverRoot, "/manifest/[id]", "second");
  const directHtml = writeFile(fixture.serverRoot, "priority.html", "direct html");
  const directIndex = writeFile(fixture.serverRoot, "priority/index.html", "direct index");
  const firstPage = writeFile(fixture.serverRoot, "pages/[id]/index.html", "first page candidate");
  const fallbackPage = writeFile(fixture.serverRoot, "pages/[id].html", "fallback page candidate");
  writePage(fixture.serverRoot, "/_expo/static/[id]", "server manifest");
  const resolveFile = createPathResolver(fixture);

  assert.equal(resolveFile("/"), home);
  assert.equal(resolveFile("/manifest/first"), manifestFirst);
  assert.equal(resolveFile("/priority"), directHtml);
  unlinkSync(directHtml);
  assert.equal(resolveFile("/priority"), directIndex);
  assert.equal(resolveFile("/pages/example"), firstPage);
  unlinkSync(firstPage);
  assert.equal(resolveFile("/pages/example"), fallbackPage);
  assert.equal(resolveFile("/_expo/static/missing"), null);
  const exact = writeFile(fixture.serverRoot, "exact.html", "exact extension");
  assert.equal(resolveFile("/exact.html"), exact);
  const extensionIndex = writeFile(fixture.serverRoot, "directory.html/index.html", "extension index");
  assert.equal(resolveFile("/directory.html"), extensionIndex);
});
