/** Adds directory indexes so GitHub Pages and plain static servers resolve clean routes. */
import { copyFile, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative, sep } from "node:path";

const outputRoot = join(process.cwd(), "dist-pages");
const generatedPnpmDirectory = join(outputRoot, "assets", "__node_modules", ".pnpm");
const publishedPnpmDirectory = join(outputRoot, "assets", "__node_modules", "_pnpm");

/** Returns every file below a directory without following generated links. */
async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat();
}

/** Keeps public route HTML while excluding framework and parameter templates. */
function isPublicRouteHtml(file) {
  if (extname(file) !== ".html" || basename(file) === "index.html") return false;
  return relative(outputRoot, file)
    .split(sep)
    .every((segment) => !segment.startsWith("(") && !segment.startsWith("[") && !segment.startsWith("+") && !segment.startsWith("_"));
}

// upload-pages-artifact@v4 excludes every dot-directory. Expo emits fonts and
// navigation images below an internal `.pnpm` path, so make that path public and
// update the generated URLs before the artifact is assembled.
await rename(generatedPnpmDirectory, publishedPnpmDirectory);

const generatedFiles = await listFiles(outputRoot);
let rewrittenAssetReferences = 0;
for (const file of generatedFiles) {
  if (![".css", ".html", ".js", ".json", ".map"].includes(extname(file))) continue;
  const source = await readFile(file, "utf8");
  const updated = source.replaceAll("/.pnpm/", "/_pnpm/");
  if (updated === source) continue;
  rewrittenAssetReferences += source.split("/.pnpm/").length - 1;
  await writeFile(file, updated);
}

const routeFiles = generatedFiles.filter(isPublicRouteHtml);
for (const source of routeFiles) {
  const routePath = source.slice(0, -".html".length);
  const destination = join(routePath, "index.html");
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

await writeFile(join(outputRoot, ".nojekyll"), "");
process.stdout.write(
  `Prepared ${routeFiles.length} clean static routes and ${rewrittenAssetReferences} publishable asset references for GitHub Pages\n`,
);
