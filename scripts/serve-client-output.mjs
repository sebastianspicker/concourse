// Local browser verification of Expo's normal production export, with no BFF proxy.
import { createReadStream, statSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, resolve, sep } from "node:path";

const output = resolve(process.argv[2] ?? "build/web-profile");
const clientRoot = resolve(output, "client");
const serverRoot = resolve(output, "server");
for (const directory of [clientRoot, serverRoot]) {
  if (!statSync(directory).isDirectory()) throw new Error(`Missing Expo export directory: ${directory}`);
}
const port = Number(process.env.PORT ?? "8084");
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Invalid PORT");

// Expo owns its server adapter dependency; resolve it through the installed SDK.
const clientRequire = createRequire(resolve("apps/client/package.json"));
const expoRequire = createRequire(clientRequire.resolve("expo/package.json"));
const { createRequestHandler } = expoRequire("expo-server/adapter/http");
const handleRoute = createRequestHandler({ build: serverRoot, environment: "production" });
const contentTypes = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".ttf": "font/ttf", ".woff": "font/woff", ".woff2": "font/woff2",
};

async function staticFile(pathname) {
  const path = resolve(clientRoot, `.${pathname}`);
  if (!path.startsWith(`${clientRoot}${sep}`)) return null;
  try { return (await stat(path)).isFile() ? path : null; }
  catch { return null; }
}

const server = createServer(async (request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url ?? "/", `http://localhost:${port}`).pathname); }
  catch { response.writeHead(400).end(); return; }
  const file = ["GET", "HEAD"].includes(request.method) ? await staticFile(pathname) : null;
  if (file) {
    response.writeHead(200, { "content-type": contentTypes[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    if (request.method === "HEAD") response.end();
    else createReadStream(file).on("error", () => response.destroy()).pipe(response);
    return;
  }
  void handleRoute(request, response, (error) => {
    if (error) process.stderr.write(`${error.message}\n`);
    if (!response.headersSent) response.writeHead(error ? 500 : 404);
    response.end();
  });
});

server.listen(port, "localhost", () => process.stdout.write(`Client export listening on http://localhost:${port}\n`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => {
  server.closeAllConnections();
  server.close();
});
