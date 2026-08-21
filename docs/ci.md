# CI Overview

This repository uses GitHub Actions for source checks, dependency and secret
scanning, CodeQL, and tag publication.

## Workflows and triggers

- `ci` (push to `main` or `dev`, all PRs)
  - Runs the source-candidate gate in `./scripts/verify-production-ready.sh`
    (release identity, lint, typecheck, direct contract tests, build,
    screenshot-set and marker checks).
- `dependency-review` (PRs only)
  - Runs the pinned OSV Scanner reusable workflow against `pnpm-lock.yaml` and fails on known vulnerabilities.
- `gitleaks` (push to `main` or `dev`, all PRs)
  - Downloads the pinned `gitleaks` CLI, verifies it against the release
    checksum manifest, and scans with `.gitleaks.toml`.
- `codeql` (push to `main` or `dev`, all PRs, weekly schedule)
  - Static analysis for JavaScript/TypeScript.
- `release` (push tags matching `v*`)
  - Validates strict tag/package/Expo/changelog identity, runs the source-candidate
    gate, smoke-tests the Node 22 BFF image on a non-default port, pushes the
    image, and then creates the GitHub release.
  - Hyphenated SemVer tags are GitHub prereleases and never move the `latest` image tag.
  - Publication is not atomic. The workflow summary reports validation, image,
    and GitHub Release job results separately.

Workflows declare scoped permissions. The main CI, Gitleaks, CodeQL, and
dependency-review workflows use `concurrency` to cancel stale runs. The tag
publication workflow remains separate so an in-progress release is not
cancelled. Jobs owned directly by this repository declare timeouts; the
dependency-review job delegates execution to a pinned reusable workflow. The
main CI workflow caches pnpm and Turbo build metadata.

## Scripts

| Script | Purpose |
|--------|---------|
| `./scripts/verify-production-ready.sh` | Main CI source-candidate gate: public-tree and screenshot evidence checks, release identity, lint, typecheck, direct contract tests, build, and marker check. |
| `pnpm release:check -- X.Y.Z[-prerelease]` | Verifies package, Expo, and changelog identity before tagging. |
| `./scripts/ci-local.sh` | Local equivalent of the main CI job: frozen install plus the source-candidate gate. |
| `./scripts/build.sh` | Convenience: runs `pnpm build` at repo root. |
| `./scripts/generate-lockfile.sh` | Regenerates `pnpm-lock.yaml` (e.g. after adding deps). |

## Local reproduction

Primary entry points:

- Main CI job equivalent:

```bash
make ci
```

- Main CI job equivalent (script):

```bash
./scripts/ci-local.sh
```

- Individual tasks (when iterating locally):

```bash
make lint
make typecheck
make test
make build
make gitleaks
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`make ci` does not replace the separate Gitleaks, OSV dependency-review,
CodeQL, Docker publication, or native/manual accessibility gates.

`pnpm typecheck` uses the native TypeScript 7 compiler. The separately available
`tsc6` executable comes from the TypeScript 6 compatibility package used by
compiler-API consumers; the two packages are intentionally not deduplicated.

## Secrets and repo settings

No secrets are required for CI to pass.

Repository settings to keep aligned with this public template:

- Keep GitHub Advanced Security, CodeQL, secret scanning, and Dependabot alerts
  enabled when available for the repository plan.
- Select required checks from the contexts emitted by a representative pull
  request, not from workflow filenames. The main CI and Gitleaks workflows run
  for every pull request. CodeQL and dependency review do the same. Reconfirm
  emitted contexts after changing workflow names, job names, or path filters.
- Do not add CI secrets for public PR workflows. If a future private-fork job
  needs secrets, run it only on trusted branch pushes or manual dispatch.
- CODEOWNERS protects CI, security policy, Docker runtime, shared contracts, and
  public institution packs.

## How to extend CI

- Add new checks to `./scripts/verify-production-ready.sh` if they must run on every PR.
- If a job needs secrets, run it only on trusted branch pushes such as `main` or `dev`, or via `workflow_dispatch`.
- Keep workflows deterministic:
  - Pin tool versions (e.g., `corepack prepare pnpm@9.15.0 --activate`).
  - Use `--frozen-lockfile`/equivalent.
- Prefer quick PR checks; schedule heavier checks (nightly/weekly) if needed.

## Optional: run with act

If you use `act`, run it without secrets for PR workflows and only add secrets for `push` or `workflow_dispatch` runs.
