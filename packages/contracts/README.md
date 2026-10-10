# Shared contracts

`@concourse/contracts` is the private workspace library that defines the wire
contract between `apps/api` and `apps/client`. It is not published to npm, and
consumers import only from the package root.

## Public surface

`src/index.ts` exports:

- Zod schemas and inferred types for events, rooms, schedules, and Today;
- `PublicRoute` for `/health`, `/events`, `/rooms`, `/schedule`, and `/today`,
  plus `PublicDataRoute` for the four data routes;
- query-key constants and request query types;
- response-header constants for request ID, institution ID, degradation, data
  mode, and retry delay;
- the API error envelope; and
- `isPublicHttpUrl`, the credential-free public HTTP(S) URL policy shared by
  configuration and wire validation.

The API validates each response before sending it, and the client validates the
same response again before exposing it to the cache or UI. Optional metadata
such as `_total`, `_degraded`, and `_sourcesConfigured` is part of the schema,
so never infer it from an HTTP success alone.

## Compatibility rules

- Treat schema, route, query, header, and error changes as cross-application
  changes. Update API producers, client consumers, fixtures, and tests together.
- Prefer additive optional fields when compatibility allows. A required,
  renamed, narrowed, or removed field is a coordinated breaking change even
  though all packages live in one workspace.
- Keep schemas runtime-portable. This package has no workspace dependency and
  must not depend on API, client, institution, Node-only, or browser-only code.
- Keep source and event URLs subject to `isPublicHttpUrl`. Do not weaken the
  credential, protocol, hostname, or network-range checks in a consumer.
- Import through `@concourse/contracts`, never through relative paths into
  `src/` or generated `dist/` output.

## Verification

Run from the repository root:

~~~bash
pnpm --filter @concourse/contracts lint
pnpm --filter @concourse/contracts typecheck
pnpm --filter @concourse/contracts test
pnpm --filter @concourse/contracts build
pnpm check:architecture
~~~

After a contract change, also run the affected API and client tests and the root
`pnpm verify` gate.
