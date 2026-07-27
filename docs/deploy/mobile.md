# Deploy: Mobile (EAS)

## Profiles

Profiles are defined in `apps/mobile/eas.json`.

## Required configuration

- Link the fork to an EAS project owned by the adopting institution. The public
  template intentionally does not contain an Expo project ID or signing setup.
- Set `INSTITUTION_ID` to the bundled public institution pack for preview and production builds.
- Set a valid HTTP(S) `EXPO_PUBLIC_BFF_BASE_URL` for preview and production builds.
- For production, set institution-owned app identifiers via
  `MOBILE_BUNDLE_IDENTIFIER` (iOS) and `MOBILE_ANDROID_PACKAGE` (Android).
- Keep `app.json#expo.version` on the numeric `X.Y.Z` base. EAS uses remote,
  auto-incremented build numbers as configured in `eas.json`.

Production config evaluation rejects both the current template identifier
`com.concoursecampuskit.mobile` and the legacy identifier
`com.campusappkit.mobile`. It fails before EAS starts when either production
identifier, the institution id, or the BFF URL is missing. Bundle identifiers,
package names, store records, signing, privacy disclosures, and device evidence
are owner-managed release inputs.

## Commands

The package scripts fetch the explicitly pinned `eas-cli@20.5.1`; the CLI is
not added to workspace dependencies because Expo discourages project-local EAS
CLI installs. EAS builds are online, owner-managed operations and are not part
of `pnpm verify`.

Set the adopting institution's values in the shell or its EAS environment
before running a build. The reserved example values below illustrate the shape;
replace them before distribution:

```bash
export INSTITUTION_ID=example
export EXPO_PUBLIC_BFF_BASE_URL=https://campus-api.example.edu
export MOBILE_BUNDLE_IDENTIFIER=edu.example.campus
export MOBILE_ANDROID_PACKAGE=edu.example.campus

pnpm --filter @concourse/mobile start
pnpm --filter @concourse/mobile dev
pnpm --filter @concourse/mobile build:preview
pnpm --filter @concourse/mobile build:production
```

For the source candidate, start with `build:preview`, install the
signed artifact on target devices, and complete the manual
accessibility/native matrix in [Frontend conventions](../frontend.md) before
considering production.
