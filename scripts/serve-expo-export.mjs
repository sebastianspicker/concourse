import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";

const exportRoot = resolve(process.argv[2] ?? join(tmpdir(), "campus-app-kit-playwright-web"));
const port = Number.parseInt(process.env.PORT ?? "8081", 10);
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

function safeJoin(root, requestedPath) {
  const resolved = resolve(root, `.${normalize(requestedPath)}`);
  return resolved === root || resolved.startsWith(`${root}/`) ? resolved : null;
}

function resolveFile(pathname) {
  if (pathname.startsWith("/_expo/static/") || pathname.startsWith("/assets/")) {
    return safeJoin(clientRoot, pathname);
  }
  if (pathname === "/") return join(serverRoot, "(tabs)", "index.html");

  const direct = safeJoin(serverRoot, pathname);
  if (!direct) return null;
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  if (!extname(direct) && existsSync(`${direct}.html`)) return `${direct}.html`;
  if (existsSync(join(direct, "index.html"))) return join(direct, "index.html");
  return null;
}

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", `http://127.0.0.1:${port}`).pathname);
  const file = resolveFile(pathname);
  if (!file || !existsSync(file)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": contentTypes[extname(file)] ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Expo export listening on http://127.0.0.1:${port}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
