# Contributing

Do not add secrets, private endpoints, protected campus data, or private integration code to this public repository. Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md); see [SUPPORT.md](SUPPORT.md) for support and adoption boundaries.

## Setup

Use Node.js 22.13+ and the pnpm version declared in package.json.

~~~bash
corepack enable
pnpm install --frozen-lockfile
pnpm verify
~~~

For local runtime work, copy apps/api/.env.example and apps/client/.env.example to their untracked .env files. Then start the API and client separately:

~~~bash
INSTITUTION_ID=hfmt pnpm --filter @concourse/api dev
INSTITUTION_ID=hfmt pnpm --filter @concourse/client start
~~~

EXPO_PUBLIC_BFF_BASE_URL in apps/client/.env must be reachable by the target client. Keep INSTITUTION_ID aligned with the API; mismatches are rejected rather than displaying another institution's data.

## Contributions we accept

- Fixes and tests for public events, rooms, schedules, Today, and client states.
- Public institution packs and public web/ICS parser improvements.
- Documentation, local tooling, accessibility, and deterministic CI improvements.

Do not contribute credentials, internal or authenticated URLs, protected-system connectors, captured personal data, or code that requires such access.

## Change expectations

- Update @concourse/contracts consumers together when changing a public DTO or error contract.
- Keep pack data schema-valid and public. Add or adjust pack tests for pack changes.
- Add focused offline-safe tests for behavior changes; use deterministic inputs or mocked HTTP instead of live campus requests.
- Update public documentation for changed commands, environment variables, API routes, or user-visible state behavior.
- Describe responsive and accessibility checks for visible client changes.
- Run the narrowest relevant checks, then pnpm verify for a complete change.

No formatter is configured. ESLint does not lint Markdown. Document exported or non-obvious behavior by explaining its invariant, responsibility, or fallback, not by repeating its identifier.
