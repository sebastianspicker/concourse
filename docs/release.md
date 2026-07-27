# Release Process

The live checkout may contain a release candidate without implying that a tag,
GitHub prerelease, or container image exists. The tag workflow has separate
image and GitHub Release jobs, so publication is not atomic. Establish current
state by checking the workflow result, GitHub Releases, and GHCR separately.

## Versioning and channels

Concourse Campus Kit uses Semantic Versioning:

- `X.Y.Z-alpha.N`, `X.Y.Z-beta.N`, or `X.Y.Z-rc.N`: public prerelease
- `X.Y.Z`: stable release

Every tag creates a matching GitHub release and version-specific BFF image.
Prereleases are marked as such on GitHub and do not move
`ghcr.io/<owner>/<repo>/bff:latest`; stable releases additionally move that tag.
Never reuse or move an existing version tag.

The repository/package SemVer and native marketing version have related but
different formats. For `1.2.0-alpha.1`, every `package.json` uses
`1.2.0-alpha.1`, while `apps/mobile/app.json` uses the platform-safe base
version `1.2.0`. EAS owns incrementing native build numbers remotely.

## Prerequisites

Before tagging:

1. Required checks pass on the exact default-branch commit being tagged.
2. `CHANGELOG.md` contains a dated, non-empty section for the exact version.
3. All five package manifests and the Expo marketing version agree.
4. Public docs use candidate wording until publication and runtime
   screenshots reflect the exact candidate.
5. The candidate contains no ignored files, credentials, signing material, or
   private-integration artifacts.
6. Manual accessibility/native gates are recorded by the release owner when a
   signed preview or store artifact is in scope.

## Prepare the candidate

### 1. Set the identity

Update the `version` field in:

- `package.json`
- `apps/bff/package.json`
- `apps/mobile/package.json`
- `packages/shared/package.json`
- `packages/institutions/package.json`

Set `apps/mobile/app.json#expo.version` and the fallback in
`apps/mobile/app.config.ts` to the numeric `X.Y.Z` base.

Also update public-facing version references in `README.md`, this guide, and
the issue-form placeholders under `.github/ISSUE_TEMPLATE/`.
Use candidate wording until the tag workflow succeeds. Changelog comparison
and release links should be added only when their targets exist. These
references are reviewed release inputs even though `pnpm release:check` only
enforces package, Expo, and changelog-section identity.

### 2. Finalize release notes

Move candidate notes from `[Unreleased]` into:

```markdown
## [X.Y.Z-alpha.N] - YYYY-MM-DD

### Added

- User-visible change
```

### 3. Reproduce the gates

```bash
corepack enable
corepack prepare pnpm@9.0.0 --activate
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm release:check -- X.Y.Z-alpha.N
pnpm verify
```

`pnpm release:check` rejects malformed SemVer, build metadata that cannot be a
Docker tag, package drift, Expo base-version drift, a missing dated changelog
heading, or an empty release-note section.

The full `pnpm verify` source-candidate gate also rejects tracked files that match
the repository's ignore policy.

### 4. Commit and tag

After review, create the release commit and an annotated tag from the same
commit:

```bash
git tag -a vX.Y.Z-alpha.N -m "Concourse Campus Kit X.Y.Z-alpha.N"
git push origin vX.Y.Z-alpha.N
```

## Automated publication

The tag workflow runs in this order:

1. validates tag, package, Expo, and changelog identity;
2. installs Chromium and runs the full release gate;
3. builds the BFF on Node 22.13 with the version embedded in `/health`;
4. smoke-tests the image with `BFF_PORT=4100`;
5. pushes the verified version tag, plus `latest` only for stable versions; and
6. creates a GitHub prerelease or stable release from the matching changelog.

The GitHub release job waits for the image job. If GitHub Release creation fails
after the image push, the image can remain public without a matching GitHub
release. The workflow summary reports each job result separately. Mobile
binaries are not produced by the public tag workflow.

## Partial publication recovery

After any failed tag workflow, inspect both GitHub Releases and the versioned
GHCR tag before taking action. Do not assume that a failed workflow published
nothing.

- If the versioned image exists but the GitHub Release does not, keep the tag
  unchanged while diagnosing the release job. A transient failed job may be
  rerun against the same tag commit.
- If the GitHub Release exists but another required artifact is missing, mark
  the release state clearly before directing users to it.
- If recovery requires a source change, do not move or reuse the tag. Prepare
  the next prerelease version.

## Mobile distribution

The adopting institution must configure its own EAS project, bundle/package
identifiers, signing, public BFF URL, and institution pack. See
[Deploy: Mobile](deploy/mobile.md).

```bash
pnpm --filter @concourse/mobile build:preview
pnpm --filter @concourse/mobile build:production
```

Do not describe a source alpha as a signed mobile release unless the candidate
was built, installed, and checked on the target devices.

## Correcting a release

Do not retag a published version. Fix the default branch, add a new changelog
section, and publish the next prerelease or patch version. If a published image
has a security defect, mark the GitHub release clearly, remove the affected
package according to the registry policy, and disclose the replacement version.
