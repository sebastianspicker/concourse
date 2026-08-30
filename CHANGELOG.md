# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`1.2.0-alpha.1` is the current source candidate. It is not considered
published until the matching tag workflow creates the GitHub prerelease and
versioned BFF image.

## [Unreleased]

No changes yet.

---

## [1.2.0-alpha.1] - 2026-07-17

### Added

- Concourse product and design contracts, English/German localization,
  institution identity, and light, dark, system, and high-contrast appearance
  settings.
- Concourse Campus Kit technical identity, route-C application assets, and a
  one-time migration from legacy local storage keys.
- Three institution-selectable design presets: the default `wayfinding` preset plus
  `atelier` and `precision`.
- Responsive rail and tab navigation, virtualized public resource lists, public detail workflows, and localized freshness and error states.
- BFF institution identity headers and client-side configuration mismatch detection.
- Strict release metadata preflight for SemVer tags, workspace packages, Expo marketing version, and changelog notes.

### Changed

- Upgraded the mobile app to Expo SDK 57, React Native 0.86, React 19.2, and Node.js 22.13 or newer.
- Replaced the demo Profile/authentication experience with Settings while retaining a compatibility redirect.
- Consolidated frontend styling on typed React Native tokens, shared workflow primitives, and pack-controlled design presets.
- Made `pnpm verify` enforce release identity, architecture boundaries, focused tests, and fresh builds.
- Moved the release BFF image to Node 22.13 and added a non-default-port health smoke before registry publication.
- Hardened public ICS parsing with bounded recurrence work, explicit timezone handling, and broader malformed-input coverage.
- Pinned the owner-managed EAS CLI path and added an explicit Docker build-context boundary for local artifacts and secrets.

### Fixed

- Made the BFF health version explicit in release images and its container
  health probes honor both `BFF_PORT` and enabled bearer authentication.
- Included the repository MIT notice in BFF container images.

### Security

- Added exact IP/CIDR trusted-proxy configuration and allowlisted multi-hop
  forwarded-client resolution; ambiguous `auto` trust is rejected.
- Kept prerelease images off the floating `latest` tag and restored default
  secret detection across every tracked or force-added public path.
- Added checksum verification before the Gitleaks release archive is extracted
  in CI.
- Made the main CI policy gate run for every pull request.
