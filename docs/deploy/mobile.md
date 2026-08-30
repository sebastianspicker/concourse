# Deploy: client (EAS)

EAS profiles are in apps/client/eas.json. This repository does not contain an EAS project ID, signing credentials, generated native projects, store records, or a deployed API; those are adopting-institution responsibilities.

## Required configuration

- Preview and production need INSTITUTION_ID and a credential-free HTTPS EXPO_PUBLIC_BFF_BASE_URL.
- Production additionally needs institution-owned MOBILE_BUNDLE_IDENTIFIER and MOBILE_ANDROID_PACKAGE values.
- Production config rejects the current and legacy template identifiers.
- apps/client/app.config.ts keeps the Expo version at numeric X.Y.Z; EAS owns remote build-number increments according to eas.json.

Set owner-managed values in the shell or EAS environment before building:

~~~bash
export INSTITUTION_ID=example
export EXPO_PUBLIC_BFF_BASE_URL=https://campus-api.example.edu
export MOBILE_BUNDLE_IDENTIFIER=edu.example.campus
export MOBILE_ANDROID_PACKAGE=edu.example.campus

pnpm --filter @concourse/client start
pnpm --filter @concourse/client dev
pnpm --filter @concourse/client build:preview
pnpm --filter @concourse/client build:production
~~~

The package invokes pinned eas-cli@20.5.1 on demand. EAS is online and owner-managed, so it is outside pnpm verify. Install and test a signed preview on target devices, including the manual checks in [client conventions](../frontend.md), before considering a production distribution.
