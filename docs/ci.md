# CI overview

GitHub Actions validates source changes, reviews dependencies, scans for secrets, runs CodeQL, publishes the static demo, and publishes release artifacts from tags.

## Workflows

- ci runs on main/dev pushes and pull requests. It installs with the frozen lockfile and runs scripts/verify-production-ready.sh, including pnpm check:architecture and fresh package builds.
- dependency-review runs on pull requests and scans pnpm-lock.yaml with OSV.
- gitleaks runs on pull requests and main/dev pushes.
- codeql runs on pull requests, main/dev pushes, and a weekly schedule.
- pages builds the fixture-only static demo on main and deploys its verified artifact.
- release runs for v* tags. It checks metadata and the source gate, verifies the apps/api image, pushes it to GHCR, and creates the GitHub Release.

The release workflow has separate image and release jobs, so publication is not atomic. Verify GHCR and GitHub Releases independently after any failed run. Stable tags receive latest; prerelease tags do not.

## Local reproduction

~~~bash
make ci
make lint
make typecheck
make test
make build
make gitleaks
~~~

scripts/ci-local.sh performs a frozen install followed by the source-candidate gate. pnpm verify does not replace remote OSV, Gitleaks, CodeQL, Docker publication, Pages deployment, EAS, or native accessibility checks.

## CI policy

No secrets are required for public pull-request workflows. Keep privileged jobs restricted to trusted branches or manual dispatch, pin tools and actions, and use the frozen lockfile. CODEOWNERS protects workflow, security, release, container, contract, and pack surfaces.
