/** Resolves files in an Expo server export without evaluating route-manifest regex content. */
import { readFileSync, realpathSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const clientPathPrefixes = ["/_expo/static/", "/assets/"];

function canonicalPath(path) {
  try {
    return realpathSync(path);
  } catch {
    return null;
  }
}

function resolveRequestedPath(canonicalRoot, requestedPath) {
  if (!canonicalRoot) return null;
  const candidate = resolve(canonicalRoot, `.${normalize(requestedPath)}`);
  if (candidate === canonicalRoot) return candidate;
  return candidate.startsWith(`${canonicalRoot}${sep}`) ? candidate : null;
}

function existingFile(canonicalRoot, candidate) {
  try {
    const canonicalCandidate = realpathSync(candidate);
    if (canonicalCandidate !== canonicalRoot && !canonicalCandidate.startsWith(`${canonicalRoot}${sep}`)) return null;
    return statSync(canonicalCandidate).isFile()
      ? { streamPath: canonicalCandidate, selectedPath: candidate }
      : null;
  } catch {
    return null;
  }
}

function isRouteRecord(route) {
  if (typeof route?.page !== "string") return false;
  return typeof route.namedRegex === "string";
}

function loadHtmlRoutes(serverRoot) {
  try {
    const manifestPath = join(serverRoot, "_expo", "routes.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (!Array.isArray(manifest.htmlRoutes)) return [];
    return manifest.htmlRoutes.filter(isRouteRecord).map(({ page }) => ({ page }));
  } catch {
    return [];
  }
}

function isDelimitedSegment(segment, opening, closing) {
  if (!segment.startsWith(opening)) return false;
  return segment.endsWith(closing);
}

function isRouteGroupSegment(segment) {
  return isDelimitedSegment(segment, "(", ")");
}

function isOmittedRouteSegment(segment) {
  if (!segment) return true;
  if (segment === "index") return true;
  return isRouteGroupSegment(segment);
}

function manifestRouteSegments(page) {
  return page.split("/").filter((segment) => !isOmittedRouteSegment(segment));
}

function isCatchAllSegment(segment) {
  return isDelimitedSegment(segment, "[...", "]");
}

function isOptionalCatchAllSegment(segment) {
  return isDelimitedSegment(segment, "[[...", "]]");
}

function isParameterSegment(segment) {
  return isDelimitedSegment(segment, "[", "]");
}

function segmentMatchesPath(segment, pathSegment) {
  if (isParameterSegment(segment)) return true;
  return segment === pathSegment;
}

function manifestPageMatchesPath(page, pathname) {
  const routeSegments = manifestRouteSegments(page);
  const pathSegments = pathname.split("/").filter(Boolean);
  let pathIndex = 0;

  for (const segment of routeSegments) {
    if (isOptionalCatchAllSegment(segment)) return true;
    if (isCatchAllSegment(segment)) return pathIndex < pathSegments.length;
    if (pathIndex >= pathSegments.length) return false;
    if (!segmentMatchesPath(segment, pathSegments[pathIndex])) return false;
    pathIndex += 1;
  }

  return pathIndex === pathSegments.length;
}

function resolveManifestRoute(canonicalServerRoot, htmlRoutes, pathname) {
  const route = htmlRoutes.find(({ page }) => manifestPageMatchesPath(page, pathname));
  if (!route) return null;

  const pageCandidates = [route.page, route.page.replace(/\/index$/, "")];
  for (const page of pageCandidates) {
    const candidate = resolveRequestedPath(canonicalServerRoot, `${page}.html`);
    const file = candidate ? existingFile(canonicalServerRoot, candidate) : null;
    if (file) return file;
  }
  return null;
}

function resolveDirectFile(canonicalServerRoot, pathname) {
  const direct = resolveRequestedPath(canonicalServerRoot, pathname);
  if (!direct) return null;
  const candidates = extname(direct)
    ? [direct, join(direct, "index.html")]
    : [direct, `${direct}.html`, join(direct, "index.html")];
  for (const candidate of candidates) {
    const file = existingFile(canonicalServerRoot, candidate);
    if (file) return file;
  }
  return null;
}

/** Creates a startup-snapshotted resolver for Expo server and client export roots. */
export function createExpoExportFileResolver({ serverRoot, clientRoot }) {
  const canonicalServerRoot = canonicalPath(serverRoot);
  const canonicalClientRoot = canonicalPath(clientRoot);
  const htmlRoutes = canonicalServerRoot ? loadHtmlRoutes(canonicalServerRoot) : [];

  return function resolveExpoExportFile(pathname) {
    for (const prefix of clientPathPrefixes) {
      if (!pathname.startsWith(prefix)) continue;
      const clientFile = resolveRequestedPath(canonicalClientRoot, pathname);
      return clientFile ? existingFile(canonicalClientRoot, clientFile) : null;
    }
    if (pathname === "/") {
      const rootFile = resolveRequestedPath(canonicalServerRoot, "/(tabs)/index.html");
      return rootFile ? existingFile(canonicalServerRoot, rootFile) : null;
    }
    return resolveDirectFile(canonicalServerRoot, pathname)
      ?? resolveManifestRoute(canonicalServerRoot, htmlRoutes, pathname);
  };
}
