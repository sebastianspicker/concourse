# Contributing

Thanks for helping. This is a public, credential-free repository, so please do
not add secrets, private endpoints, protected campus data, or private
integration code. Participation is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md), the [runbook](docs/runbook.md) is the
setup and configuration authority, and [SUPPORT.md](SUPPORT.md) explains what
the issue tracker covers.

## Setup

Use Node.js 22.13+ and the pnpm version declared in `package.json`.

~~~bash
corepack enable
pnpm install --frozen-lockfile
pnpm verify
~~~

For local runtime work, copy `apps/api/.env.example` and
`apps/client/.env.example` to their untracked `.env` files, then start the API
and client in separate terminals:

~~~bash
INSTITUTION_ID=example pnpm --filter @concourse/api dev
INSTITUTION_ID=example pnpm --filter @concourse/client start
~~~

`EXPO_PUBLIC_BFF_BASE_URL` in `apps/client/.env` must be reachable by the target
client. Keep `INSTITUTION_ID` aligned with the API; a mismatch is rejected rather
than showing another institution's data.

## What we accept

- Fixes and tests for public events, rooms, schedules, Today, and client states.
- Public institution packs and public web/ICS parser improvements.
- Documentation, local tooling, accessibility, and deterministic CI work.

Please do not contribute credentials, internal or authenticated URLs,
protected-system connectors, captured personal data, or code that needs such
access.

## What a change should include

- Update `@concourse/contracts` consumers together when you change a public DTO,
  route, query, header, or error contract. Follow the
  [shared-contract compatibility guide](packages/contracts/README.md).
- Keep pack data schema-valid and public, and adjust the pack tests when packs
  change.
- Add focused, offline-safe tests for behavior changes. Use deterministic inputs
  or mocked HTTP instead of live campus requests.
- Update the public docs for any changed command, environment variable, API
  route, or user-visible state.
- Describe the responsive and accessibility checks for visible client changes.
- Run the narrowest relevant checks, then `pnpm verify` for a complete change.

There is no formatter, and ESLint does not lint Markdown. When documenting
exported or non-obvious behavior, explain the invariant, responsibility, or
fallback rather than restating the identifier.
