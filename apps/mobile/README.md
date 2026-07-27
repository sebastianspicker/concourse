# Mobile application

`@concourse/mobile` is the Expo Router client for native and responsive web
targets.

## Run locally

From the repository root:

```bash
cp apps/mobile/.env.example apps/mobile/.env
INSTITUTION_ID=hfmt pnpm --filter @concourse/mobile start
```

Set `EXPO_PUBLIC_BFF_BASE_URL` in `apps/mobile/.env` before starting. Run a BFF
with the same institution ID in a separate terminal.

`start` launches Expo for Expo Go. Use `dev` only when a compatible development
client is already installed:

```bash
INSTITUTION_ID=hfmt pnpm --filter @concourse/mobile dev
```

## Build configuration

- Preview builds require `INSTITUTION_ID` and a valid HTTP(S)
  `EXPO_PUBLIC_BFF_BASE_URL`.
- Production builds additionally require `MOBILE_BUNDLE_IDENTIFIER` and
  `MOBILE_ANDROID_PACKAGE`.
- Production config rejects the template and legacy application identifiers.
- The repository does not include EAS project linkage, signing credentials, or
  generated native projects.

See [`../../docs/deploy/mobile.md`](../../docs/deploy/mobile.md) for the EAS
profiles and owner-managed release inputs.

## Tests

```bash
pnpm --filter @concourse/mobile test
pnpm test:web
```

The package tests cover data loading, caching, configuration, screens, shared
components, themes, localization, and utilities. The root browser command
exports the web application and runs Chromium workflows, axe checks, responsive
checks, and screenshot capture.

Browser and native end-to-end tests are documented in
[`e2e/README.md`](e2e/README.md).
