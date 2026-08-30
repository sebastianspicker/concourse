import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";

import { checkArchitecture } from "../check-architecture.mjs";

const packageDefinitions = {
  "@concourse/contracts": { directory: "packages/contracts", dependencies: {} },
  "@concourse/institutions": { directory: "packages/institutions", dependencies: { "@concourse/contracts": "workspace:*" } },
  "@concourse/api": { directory: "apps/api", dependencies: { "@concourse/contracts": "workspace:*", "@concourse/institutions": "workspace:*" } },
  "@concourse/client": { directory: "apps/client", dependencies: { "@concourse/contracts": "workspace:*", "@concourse/institutions": "workspace:*" } },
};

function writeFixture(root, { manifests = {}, sourceFiles = {} } = {}) {
  for (const [name, definition] of Object.entries(packageDefinitions)) {
    const { directory, dependencies } = definition;
    const manifest = { name, private: true, dependencies, ...manifests[name] };
    const manifestPath = resolve(root, directory, "package.json");
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(manifest));
  }
  const defaults = {
    "packages/contracts/src/index.ts": "export {};\n",
    "packages/institutions/src/index.ts": "export {};\n",
    "apps/api/src/index.ts": "export {};\n",
    "apps/client/src/index.ts": "export {};\n",
    "apps/client/app/index.ts": "export {};\n",
    "apps/client/config/index.js": "export {};\n",
  };
  for (const [path, source] of Object.entries({ ...defaults, ...sourceFiles })) {
    const sourcePath = resolve(root, path);
    mkdirSync(dirname(sourcePath), { recursive: true });
    writeFileSync(sourcePath, source);
  }
}

function withFixture(options, run) {
  const root = mkdtempSync(resolve(tmpdir(), "concourse-architecture-"));
  try {
    writeFixture(root, options);
    run(checkArchitecture(root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("accepts the declared workspace dependency graph", () => {
  withFixture({}, (result) => {
    assert.deepEqual(result.cycles, []);
    assert.deepEqual(result.violations, []);
  });
});

test("rejects a contracts-to-institutions package import", () => {
  withFixture({ sourceFiles: { "packages/contracts/src/index.ts": 'import {\n  institution,\n} from "@concourse/institutions";\n' } }, (result) => {
    assert.match(result.violations.join("\n"), /@concourse\/contracts must not import @concourse\/institutions/);
  });
});

test("rejects a client-to-API package import", () => {
  withFixture({ sourceFiles: { "apps/client/src/index.ts": 'import "@concourse/api";\n' } }, (result) => {
    assert.match(result.violations.join("\n"), /@concourse\/client must not import @concourse\/api/);
  });
});

test("rejects an API-to-client package import", () => {
  withFixture({ sourceFiles: { "apps/api/src/index.ts": 'import "@concourse/client";\n' } }, (result) => {
    assert.match(result.violations.join("\n"), /@concourse\/api must not import @concourse\/client/);
  });
});

test("rejects client platform imports from localization", () => {
  withFixture({ sourceFiles: {
    "apps/client/src/platform/http.ts": 'import "@/localization/dictionaries";\n',
    "apps/client/src/localization/dictionaries.ts": "export {};\n",
  } }, (result) => {
    assert.match(result.violations.join("\n"), /platform must not import src\/localization/);
  });
});

test("rejects direct relative cross-workspace source imports", () => {
  withFixture({ sourceFiles: { "packages/contracts/src/index.ts": 'import "../../institutions/src/index";\n' } }, (result) => {
    assert.match(result.violations.join("\n"), /direct relative cross-workspace source import packages\/institutions\/src\/index\.ts/);
  });
});

test("rejects a manifest-only workspace dependency cycle", () => {
  withFixture({ manifests: { "@concourse/contracts": { dependencies: { "@concourse/institutions": "workspace:*" } } } }, (result) => {
    assert.match(result.cycles.join("\n"), /@concourse\/contracts -> @concourse\/institutions -> @concourse\/contracts/);
  });
});
