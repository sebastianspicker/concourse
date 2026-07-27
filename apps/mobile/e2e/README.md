# End-to-end tests

End-to-end tests are grouped by runtime:

```text
e2e/
  native/  Detox tests and shared initialization
  web/     Playwright browser tests
```

## Web

`web/concourse.spec.ts` is part of the active source-candidate gate. From the
repository root:

```bash
pnpm test:web
```

Playwright exports the Expo web application, starts the fixture BFF, and checks
navigation, accessibility, responsive layouts, zoom, and runtime screenshots.

## Native

`native/` contains Detox definitions for navigation, events, and schedules.
They are incomplete in a clean checkout because the repository does not include
generated `ios/` or `android/` projects.

A downstream application must provide:

- native projects compatible with Expo SDK 57
- application names and build paths matching `apps/mobile/detox.config.js`, or
  an updated Detox configuration
- an iOS Simulator and Xcode for iOS tests
- Java 17, Android SDK, and an AVD named `Pixel_5_API_33` for Android tests
- a deterministic BFF or fixture source

The current iOS Detox configuration expects an `iPhone 15` simulator and native
workspace and scheme names of `CampusApp`.

From `apps/mobile`, after native projects are configured:

```bash
pnpm test:e2e:build:ios
pnpm test:e2e:ios

pnpm test:e2e:build:android
pnpm test:e2e:android
```

The E2E GitHub Actions workflow detects native projects and skips the
corresponding native jobs when they are absent. The root `pnpm test:e2e`
command is a separate process-level BFF test and does not require native
projects.

Selectors and shared native helpers are defined in `native/init.ts`. Use those
IDs, wait for asynchronous state with Detox `waitFor`, and keep each test
independent. Do not use fixed delays to mask missing state transitions.
