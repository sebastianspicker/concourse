# Release Process

## Versioning

Semantic Versioning:

- MAJOR: breaking changes
- MINOR: new features, backward compatible
- PATCH: bug fixes, backward compatible

## Prerequisites

Before tagging a release:

1. CI checks pass on the current default branch (`dev` after branch migration)
2. `CHANGELOG.md` has a section for the new version
3. All `package.json` files have the new version
4. Docs are up to date

## Release Steps

### 1. Update Version

Bump the `version` field in each `package.json`:

- `package.json` (root)
- `apps/bff/package.json`
- `apps/mobile/package.json`
- `packages/shared/package.json`
- `packages/institutions/package.json`

### 2. Update Changelog

Add a section to `CHANGELOG.md`:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature

### Changed
- Changed feature

### Fixed
- Bug fix

### Removed
- Removed feature
```

### 3. Commit and Tag

```bash
git add package.json apps/bff/package.json apps/mobile/package.json \
  packages/shared/package.json packages/institutions/package.json CHANGELOG.md
git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin vX.Y.Z
```

### 4. Automated Release

Pushing the tag triggers the release workflow:

1. Validate: runs all CI checks
2. Create Release: creates a GitHub release with the changelog section for that version
3. Build Docker: builds and pushes the BFF image to GHCR (`ghcr.io/[owner]/campus-app-kit/bff:[version]`)
4. Notify: posts a summary to the GitHub Actions step summary

## Mobile App Release

Mobile releases are handled via EAS:

```bash
cd apps/mobile
pnpm build:preview
pnpm build:production
```

Submit to stores using EAS Submit or manually via the app store consoles.

## Rollback

If a release has critical issues:

1. Delete the GitHub release
2. Delete the git tag (`git push origin :vX.Y.Z`)
3. Revert the version commit
4. Cut a hotfix release
