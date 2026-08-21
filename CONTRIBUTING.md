# Contributing

Do not add secrets, private endpoints, or protected campus data to this public
repository.
By participating, you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). For
adoption questions and reporting boundaries, read [SUPPORT.md](SUPPORT.md).

## Prerequisites

- Node.js 22.13 or newer (see `.nvmrc`)
- pnpm 9 (see `package.json#packageManager`)

Tip: enable Corepack once:

```bash
corepack enable
```

The repository uses TypeScript 7 for `tsc`. The `typescript` dependency
intentionally resolves to the TypeScript 6 compatibility package because
some tools still consume the compiler API; `tsc6` is available for
compatibility diagnostics.

## Local setup

```bash
pnpm install --frozen-lockfile
pnpm verify
```

### Run the BFF (optional)

```bash
INSTITUTION_ID=hfmt pnpm --filter @concourse/bff dev
```

### Run the mobile app

```bash
INSTITUTION_ID=hfmt pnpm --filter @concourse/mobile start
```

If you want the mobile app to call a running BFF, set `EXPO_PUBLIC_BFF_BASE_URL` in
`apps/mobile/.env` (copy from `apps/mobile/.env.example`). This is required in both
development and production; there is no automatic fallback. The mobile app and
BFF must use the same `INSTITUTION_ID`; a mismatch is rejected rather than showing
data from a different institution pack.

## What we accept

- Bug fixes and tests for existing public features (rooms, schedules, events, Today).
- Improvements to docs and local DX (scripts, CI, linting).
- Improvements to the connector pattern (public connectors + private stubs), as long as public repo safety remains intact.

## What we won’t accept

- Real institution credentials, tokens, or internal URLs.
- Connectors that require access to protected systems in this public repo.

## Documentation conventions

- Start hand-maintained source, script, and comment-capable configuration files with a concise purpose statement.
- Document exported and non-obvious functions, components, hooks, and class methods when their contract or design reason is not already clear from types and naming.
- Explain responsibility, invariants, or fallback behavior instead of restating a filename or symbol name. Anonymous callbacks, generated output, lockfiles, strict JSON, and data fixtures do not need commentary.

## Pull request checklist

- `pnpm verify` passes locally.
- No placeholder markers added (unfinished task markers, stub markers, etc.).
- Tests are added for behavior changes (offline-capable; no real network required).
- Docs are updated when you change workflows or env vars.
- Visible UI changes include regenerated screenshots plus responsive and accessibility evidence.
- Release/version changes pass `pnpm release:check`.
