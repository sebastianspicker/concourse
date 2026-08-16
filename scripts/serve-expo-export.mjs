/** Serves an Expo server export from loopback without adding a production web-server dependency. */
import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { parsePort } from "./serve-expo-export-port.mjs";
import { createExpoExportFileResolver } from "./serve-expo-export-routes.mjs";

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

const resolveExpoExportFile = createExpoExportFileResolver({ serverRoot, clientRoot });

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
function sendFile(request, response, resolvedFile) {
  const headers = {
    "content-type": contentTypes[extname(resolvedFile.selectedPath)] ?? "application/octet-stream",
    "cache-control": "no-store",
  };
  if (request.method === "HEAD") {
    response.writeHead(200, headers);
    response.end();
    return;
  }
  const stream = createReadStream(resolvedFile.streamPath);
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
  const file = resolveExpoExportFile(pathname);
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
