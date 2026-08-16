/** Serves the prepared GitHub Pages artifact from its production base path. */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const outputRoot = resolve(process.argv[2] ?? join(process.cwd(), "dist-pages"));
const basePath = "/concourse";
const port = Number.parseInt(process.env.PORT ?? "8082", 10);
if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) throw new Error("PORT must be between 1 and 65535");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ttf": "font/ttf",
};

/** Resolves a request beneath the artifact root. */
function safeJoin(requestedPath) {
  const candidate = resolve(outputRoot, `.${normalize(requestedPath)}`);
  return candidate === outputRoot || candidate.startsWith(`${outputRoot}${sep}`) ? candidate : null;
}

/** Returns a regular file or null without exposing filesystem errors. */
async function existingFile(candidate) {
  if (!candidate) return null;
  try {
    return (await stat(candidate)).isFile() ? candidate : null;
  } catch {
    return null;
  }
}

/** Maps the production base path to exported HTML and static assets. */
async function resolveFile(pathname) {
  if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) return null;
  const relativePath = pathname.slice(basePath.length) || "/";
  const direct = safeJoin(relativePath);
  if (!direct) return null;
  const candidates = extname(direct)
    ? [direct]
    : [direct, `${direct}.html`, join(direct, "index.html")];
  for (const candidate of candidates) {
    const file = await existingFile(candidate);
    if (file) return file;
  }
  return null;
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD", "content-type": "text/plain; charset=utf-8" });
    response.end("Method not allowed");
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", `http://127.0.0.1:${port}`).pathname);
  } catch {
    response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }
  const file = await resolveFile(pathname);
  if (!file) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type": contentTypes[extname(file)] ?? "application/octet-stream",
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Static Pages artifact listening on http://127.0.0.1:${port}${basePath}/\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
