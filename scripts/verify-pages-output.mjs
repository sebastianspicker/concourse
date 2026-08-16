/** Verifies the exact static-demo artifact before GitHub Pages upload. */
import { lstat, readFile, readdir } from "node:fs/promises";
import { basename, extname, join, relative, resolve, sep } from "node:path";

const outputRoot = resolve(process.argv[2] ?? join(process.cwd(), "dist-pages"));
const basePath = "/concourse/";

const expectedHtml = new Set([
  "(tabs)/events.html",
  "(tabs)/index.html",
  "(tabs)/profile.html",
  "(tabs)/rooms.html",
  "(tabs)/settings.html",
  "+not-found.html",
  "_sitemap.html",
  "events.html",
  "events/[id].html",
  "events/index.html",
  "events/library-tour.html",
  "events/library-tour/index.html",
  "events/student-services.html",
  "events/student-services/index.html",
  "events/welcome-concert.html",
  "events/welcome-concert/index.html",
  "index.html",
  "profile.html",
  "profile/index.html",
  "rooms.html",
  "rooms/[id].html",
  "rooms/auditorium/index.html",
  "rooms/index.html",
  "rooms/library/index.html",
  "rooms/seminar-204/index.html",
  "schedule/[id].html",
  "schedule/open-rehearsal.html",
  "schedule/open-rehearsal/index.html",
  "schedule/orientation.html",
  "schedule/orientation/index.html",
  "schedule/welcome-session.html",
  "schedule/welcome-session/index.html",
  "settings.html",
  "settings/index.html",
]);

const expectedAssets = new Set([
  ".nojekyll",
  "_expo/.routes.json",
  "_expo/static/js/web/index-{hash}.js",
  "assets/MaterialIcons.{hash}.ttf",
  "assets/arrow_down.{hash}.png",
  "assets/back-icon-mask.{hash}.png",
  "assets/back-icon.{hash}.png",
  "assets/clear-icon.{hash}.png",
  "assets/clear-icon.{hash}@2x.png",
  "assets/clear-icon.{hash}@3x.png",
  "assets/clear-icon.{hash}@4x.png",
  "assets/close-icon.{hash}.png",
  "assets/close-icon.{hash}@2x.png",
  "assets/close-icon.{hash}@3x.png",
  "assets/close-icon.{hash}@4x.png",
  "assets/error.{hash}.png",
  "assets/file.{hash}.png",
  "assets/forward.{hash}.png",
  "assets/pkg.{hash}.png",
  "assets/search-icon.{hash}.png",
  "assets/sitemap.{hash}.png",
  "assets/unmatched.{hash}.png",
  "favicon.ico",
]);

const allowedExtensions = new Set([".html", ".ico", ".js", ".json", ".png", ".ttf"]);
const forbiddenText = ["/.pnpm/", "http://localhost:", "http://127.0.0.1:", "EXPO_PUBLIC_BFF_BASE_URL="];

/** Enumerates regular artifact files and rejects links or special nodes. */
async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    const metadata = await lstat(path);
    if (metadata.isSymbolicLink()) throw new Error(`Artifact must not contain symlinks: ${relative(outputRoot, path)}`);
    if (metadata.isDirectory()) files.push(...await listFiles(path));
    else if (metadata.isFile()) files.push(path);
    else throw new Error(`Artifact contains an unsupported filesystem node: ${relative(outputRoot, path)}`);
  }
  return files;
}

/** Normalizes content hashes while retaining the exact expected asset names and locations. */
function logicalAssetPath(file) {
  if (file.startsWith("_expo/static/js/web/")) {
    return file.replace(/index-[0-9a-f]{32}\.js$/, "index-{hash}.js");
  }
  if (file.startsWith("assets/__node_modules/_pnpm/")) {
    return `assets/${basename(file).replace(/\.[0-9a-f]{32}(@[234]x)?\./, ".{hash}$1.")}`;
  }
  return file;
}

/** Resolves a base-path reference to a file inside the artifact. */
function referencedFile(reference) {
  if (!reference.startsWith(basePath)) return null;
  const pathname = reference.slice(basePath.length).split(/[?#]/, 1)[0];
  const candidate = resolve(outputRoot, pathname || "index.html");
  if (candidate !== outputRoot && !candidate.startsWith(`${outputRoot}${sep}`)) {
    throw new Error(`Artifact reference escapes the output root: ${reference}`);
  }
  const candidates = extname(candidate)
    ? [candidate]
    : [candidate, `${candidate}.html`, join(candidate, "index.html")];
  return candidates.find((file) => fileSet.has(file)) ?? candidate;
}

const files = await listFiles(outputRoot);
const relativeFiles = files.map((file) => relative(outputRoot, file).split(sep).join("/"));
const actualHtml = new Set(relativeFiles.filter((file) => extname(file) === ".html"));
const missingHtml = [...expectedHtml].filter((file) => !actualHtml.has(file));
const unexpectedHtml = [...actualHtml].filter((file) => !expectedHtml.has(file));
const actualAssets = relativeFiles.filter((file) => extname(file) !== ".html").map(logicalAssetPath);
const actualAssetSet = new Set(actualAssets);
const missingAssets = [...expectedAssets].filter((file) => !actualAssetSet.has(file));
const unexpectedAssets = [...actualAssetSet].filter((file) => !expectedAssets.has(file));

if (missingHtml.length || unexpectedHtml.length) {
  throw new Error(`Static HTML inventory mismatch. Missing: ${missingHtml.join(", ") || "none"}. Unexpected: ${unexpectedHtml.join(", ") || "none"}.`);
}
if (missingAssets.length || unexpectedAssets.length || actualAssets.length !== actualAssetSet.size) {
  throw new Error(`Static asset inventory mismatch. Missing: ${missingAssets.join(", ") || "none"}. Unexpected: ${unexpectedAssets.join(", ") || "none"}.`);
}
if (relativeFiles.some((file) => file.endsWith(".map"))) throw new Error("Static artifact must not publish source maps");

for (const file of relativeFiles) {
  if (file === ".nojekyll") continue;
  if (!allowedExtensions.has(extname(file))) throw new Error(`Unexpected artifact file type: ${file}`);
}

const fileSet = new Set(files.map((file) => resolve(file)));
let checkedReferences = 0;
for (const htmlPath of files.filter((file) => extname(file) === ".html")) {
  const source = await readFile(htmlPath, "utf8");
  for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(?:data:|mailto:|tel:|#)/.test(reference)) continue;
    if (/^https?:\/\//.test(reference)) throw new Error(`Executable HTML reference must stay local: ${reference}`);
    const target = referencedFile(reference);
    if (!target) throw new Error(`HTML reference does not use ${basePath}: ${reference}`);
    if (!fileSet.has(target)) throw new Error(`HTML reference is missing from the artifact: ${reference}`);
    checkedReferences += 1;
  }
}

for (const textPath of files.filter((file) => [".html", ".js", ".json"].includes(extname(file)))) {
  const source = await readFile(textPath, "utf8");
  for (const marker of forbiddenText) {
    if (source.includes(marker)) throw new Error(`${relative(outputRoot, textPath)} contains forbidden text ${marker}`);
  }
}

process.stdout.write(`Verified ${files.length} static-demo files, ${actualHtml.size} HTML documents, ${actualAssetSet.size} assets, and ${checkedReferences} local references\n`);
