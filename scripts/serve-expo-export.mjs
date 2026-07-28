/** Serves an Expo server export from loopback without adding a production web-server dependency. */
import { createReadStream, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import { parsePort } from "./serve-expo-export-port.mjs";

const exportRoot = resolve(process.argv[2] ?? join(tmpdir(), "concourse-playwright-web"));
const port = parsePort(process.env.PORT);
const serverRoot = join(exportRoot, "server");
const clientRoot = join(exportRoot, "client");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
};

const clientPathPrefixes = ["/_expo/static/", "/assets/"];

/** Resolves a request beneath one root and rejects path traversal outside it. */
function safeJoin(root, requestedPath) {
  const resolved = resolve(root, `.${normalize(requestedPath)}`);
  return resolved === root || resolved.startsWith(`${root}/`) ? resolved : null;
}

/** Returns the candidate only when it exists as a regular file. */
function existingFile(candidate) {
  try {
    return statSync(candidate).isFile() ? candidate : null;
  } catch {
    return null;
  }
}

/** Loads Expo's generated route manifest while treating absent or invalid metadata as no routes. */
function loadHtmlRoutes() {
  try {
    const manifest = JSON.parse(readFileSync(join(serverRoot, "_expo", "routes.json"), "utf8"));
    if (!Array.isArray(manifest.htmlRoutes)) return [];
    return manifest.htmlRoutes.flatMap((route) => {
      if (typeof route?.namedRegex !== "string" || typeof route?.page !== "string") return [];
      return [{ page: route.page }];
    });
  } catch {
    return [];
  }
}

const htmlRoutes = loadHtmlRoutes();

/** Removes Expo route groups and index markers that do not consume a URL segment. */
function manifestRouteSegments(page) {
  return page.split("/").flatMap((segment) => {
    if (!segment || segment === "index" || (segment.startsWith("(") && segment.endsWith(")"))) return [];
    return [segment];
  });
}

function isCatchAllSegment(segment) {
  return segment.startsWith("[...") && segment.endsWith("]");
}

function isOptionalCatchAllSegment(segment) {
  return segment.startsWith("[[...") && segment.endsWith("]]");
}

function isParameterSegment(segment) {
  return segment.startsWith("[") && segment.endsWith("]");
}

/** Matches Expo static, parameter, and catch-all route pages without evaluating manifest regex text. */
function manifestPageMatchesPath(page, pathname) {
  const routeSegments = manifestRouteSegments(page);
  const pathSegments = pathname.split("/").filter(Boolean);
  let pathIndex = 0;

  for (const segment of routeSegments) {
    if (isOptionalCatchAllSegment(segment)) return true;
    if (isCatchAllSegment(segment)) return pathIndex < pathSegments.length;
    if (pathIndex >= pathSegments.length) return false;
    if (!isParameterSegment(segment) && segment !== pathSegments[pathIndex]) return false;
    pathIndex += 1;
  }

  return pathIndex === pathSegments.length;
}

/** Matches a pathname against Expo's route manifest and resolves its generated HTML file. */
function resolveManifestRoute(pathname) {
  const route = htmlRoutes.find(({ page }) => manifestPageMatchesPath(page, pathname));
  if (!route) return null;

  const pageCandidates = [route.page, route.page.replace(/\/index$/, "")];
  return pageCandidates
    .map((page) => safeJoin(serverRoot, `${page}.html`))
    .filter(Boolean)
    .map(existingFile)
    .find(Boolean) ?? null;
}

/** Resolves static assets and route HTML across Expo's client/server output layout. */
function resolveFile(pathname) {
  if (clientPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    const clientFile = safeJoin(clientRoot, pathname);
    return clientFile ? existingFile(clientFile) : null;
  }
  if (pathname === "/") return existingFile(join(serverRoot, "(tabs)", "index.html"));

  const direct = safeJoin(serverRoot, pathname);
  if (!direct) return null;
  const candidates = extname(direct)
    ? [direct, join(direct, "index.html")]
    : [direct, `${direct}.html`, join(direct, "index.html")];
  return candidates.map(existingFile).find(Boolean) ?? resolveManifestRoute(pathname);
}

/** Sends a small plain-text error response without exposing filesystem details. */
function sendText(response, status, message) {
  response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  response.end(message);
}

/** Decodes the request path and converts malformed URL encoding into a bad request. */
function parsePathname(requestUrl) {
  try {
    return decodeURIComponent(new URL(requestUrl ?? "/", `http://127.0.0.1:${port}`).pathname);
  } catch {
    return null;
  }
}

/** Streams one resolved file and handles HEAD without reading its body. */
function sendFile(request, response, file) {
  const headers = {
    "content-type": contentTypes[extname(file)] ?? "application/octet-stream",
    "cache-control": "no-store",
  };
  if (request.method === "HEAD") {
    response.writeHead(200, headers);
    response.end();
    return;
  }
  const stream = createReadStream(file);
  stream.once("error", () => {
    if (!response.headersSent) sendText(response, 404, "Not found");
    else response.destroy();
  });
  stream.once("open", () => {
    response.writeHead(200, headers);
    stream.pipe(response);
  });
}

const server = createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("allow", "GET, HEAD");
    sendText(response, 405, "Method not allowed");
    return;
  }

  const pathname = parsePathname(request.url);
  if (!pathname) {
    sendText(response, 400, "Bad request");
    return;
  }
  const file = resolveFile(pathname);
  if (!file) {
    sendText(response, 404, "Not found");
    return;
  }
  sendFile(request, response, file);
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Expo export listening on http://127.0.0.1:${port}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
