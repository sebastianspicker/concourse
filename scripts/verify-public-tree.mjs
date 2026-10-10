import { spawnSync } from "node:child_process";
import { lstatSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function verifyPublicTree(root = process.cwd(), run = spawnSync) {
  const execute = (args, input) => run("git", args, {
    cwd: root, encoding: "utf8", input, maxBuffer: 64 * 1024 * 1024,
  });
  const tracked = execute(["ls-files", "-z"]);
  if (tracked.error || tracked.status !== 0) throw new Error("Public-tree tracked-file scan failed", { cause: tracked.error ?? tracked.stderr });
  const paths = tracked.stdout.split("\0").filter(Boolean).filter((path) => {
    try { lstatSync(resolve(root, path)); return true; }
    catch (error) { if (error.code === "ENOENT" || error.code === "ENOTDIR") return false; throw error; }
  });
  // Feed even an empty inventory to Git: scanner failures must remain visible.
  const ignored = execute(["check-ignore", "--no-index", "-z", "--stdin"], paths.length ? `${paths.join("\0")}\0` : "");
  if (ignored.error || ![0, 1].includes(ignored.status)) throw new Error("Public-tree ignore scan failed", { cause: ignored.error ?? ignored.stderr });
  return ignored.stdout.split("\0").filter(Boolean);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const forbidden = verifyPublicTree();
    if (forbidden.length) {
      process.stderr.write(`Tracked files must not match .gitignore:\n${forbidden.map((path) => `  ${JSON.stringify(path)}`).join("\n")}\n`);
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
