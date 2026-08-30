import { rmSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageDirectory = resolve(process.cwd());
const outputDirectory = resolve(packageDirectory, "dist");
const packagePath = relative(repositoryRoot, packageDirectory).replaceAll("\\", "/");
const isWorkspacePackage = /^(apps|packages)\/[^/]+$/.test(packagePath);

if (!isWorkspacePackage || basename(outputDirectory) !== "dist" || outputDirectory === packageDirectory) {
  throw new Error(`Refusing to clean unexpected output directory: ${outputDirectory}`);
}

rmSync(outputDirectory, { force: true, recursive: true });
