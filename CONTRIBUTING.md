# Contributing

This repository is kept safe to publish: no secrets, no private endpoints.

## Prerequisites

- Node.js 20 (see `.nvmrc`)
- pnpm 9 (see `package.json#packageManager`)

Tip: enable Corepack once:

```bash
corepack enable
```

## Local setup

```bash
pnpm install --frozen-lockfile
pnpm verify
```

### Run the BFF (optional)

```bash
INSTITUTION_ID=hfmt pnpm --filter @campus/bff dev
```

### Run the mobile app

```bash
pnpm --filter @campus/mobile start
```

If you want the mobile app to call a running BFF, set:

- `EXPO_PUBLIC_BFF_BASE_URL` (see `apps/mobile/src/utils/bffConfig.ts`)

## What we accept

- Bug fixes and tests for existing public features (rooms, schedules, events, Today).
- Improvements to docs and local DX (scripts, CI, linting).
- Improvements to the connector pattern (public connectors + private stubs), as long as public repo safety remains intact.

## What we won’t accept

- Real institution credentials, tokens, or internal URLs.
- Connectors that require access to protected systems in this public repo.

## Pull request checklist

- `pnpm verify` passes locally.
- No placeholder markers added (unfinished task markers, stub markers, etc.).
- Tests are added for behavior changes (offline-capable; no real network required).
- Docs are updated when you change workflows or env vars.
