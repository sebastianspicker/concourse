# Connectors

The BFF loads one institution pack and uses its public source configuration for
each data route.

| Route | Source |
|---|---|
| `/events` | Public HTML URLs in `publicSources.events` |
| `/schedule` | Public ICS URLs in `publicSources.schedules` |
| `/rooms` | `publicRooms` from the pack |
| `/today` | Same-day public events plus `publicRooms` |

Public connector code lives in `apps/bff/src/connectors/public/`. HTML and ICS
responses are normalized into the schemas in
`packages/shared/src/domain/public.ts`.

## Failure behavior

- Fetches use bounded timeouts.
- Source failures are logged with request context.
- When at least one source succeeds, events and schedules can return partial
  data with `_degraded: true`.
- Degraded results are not cached.
- When no configured source can return usable data, the route returns a
  sanitized error.
- ICS recurrence expansion is limited by `RRULE_EXPANSION_HORIZON_DAYS`.

## Adding a public source

1. Add the public URL to an institution pack.
2. Extend the connector only if the existing HTML or ICS parser cannot
   normalize the source.
3. Add synthetic fixtures and deterministic tests.
4. Test upstream failure, partial success, malformed data, cancellation, and
   cache behavior.
5. Run `pnpm verify`.

Do not commit authenticated URLs, private hostnames, access tokens, captured
user data, or fixtures copied from protected systems.

## Private extension stubs

`apps/bff/src/connectors/private-stubs/` contains interfaces and inactive stub
implementations. The public server does not import them. A private implementation
must define authentication, error, empty-state, logging, and data-retention
behavior before wiring those interfaces into a runtime.
