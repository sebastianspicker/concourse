# Deploy: Mobile (EAS)

## Profiles

Profiles are defined in `apps/mobile/eas.json`.

## Required configuration

- Set app identifiers via `MOBILE_BUNDLE_IDENTIFIER` (iOS) and `MOBILE_ANDROID_PACKAGE` (Android).
- Set `EXPO_PUBLIC_BFF_BASE_URL` for preview/production builds.

## Commands

```bash
pnpm --filter @campus/mobile start
pnpm --filter @campus/mobile dev
pnpm --filter @campus/mobile build:preview
pnpm --filter @campus/mobile build:production
```
