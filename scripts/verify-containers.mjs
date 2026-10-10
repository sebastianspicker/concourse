import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { smokeImage } from "./smoke-api-image.mjs";

export function verifyContainers() {
  const revision = `local-${process.pid}-${Date.now()}`;
  for (const [flavor, dockerfile] of [["development", "apps/api/Dockerfile"], ["production", "apps/api/Dockerfile.prod"]]) {
    const image = `concourse-verify-${flavor}:${revision}`;
    const build = spawnSync("docker", ["build", "--file", dockerfile, "--build-arg", `APP_VERSION=${revision}`, "--tag", image, "."], { stdio: "inherit", timeout: 20 * 60 * 1000 });
    if (build.error || build.status !== 0) throw new Error(`${flavor} image build failed`, { cause: build.error });
    smokeImage(image, revision);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { verifyContainers(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
