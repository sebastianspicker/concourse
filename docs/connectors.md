# Public sources

The API loads one public institution pack and reads only the sources configured by that pack.

| Route | Input |
|---|---|
| /events | Public HTTP(S) pages in publicSources.events |
| /schedule | Public ICS feeds in publicSources.schedules |
| /rooms | publicRooms in the pack |
| /today | Same-day public events and pack-defined rooms |

Source adapters live in apps/api/src/sources/web-events/ and apps/api/src/sources/ics/. They normalize upstream data into the public resource schemas in packages/contracts/src/resources/.

## Failure behavior

- Fetches have bounded timeouts and failures are logged with request context.
- If at least one event or schedule source succeeds, the API can return partial data with _degraded: true.
- Degraded results are not cached.
- No usable result from configured sources becomes a sanitized API error.
- ICS recurrence expansion is bounded by RRULE_EXPANSION_HORIZON_DAYS.

## Adding a public source

1. Add an unauthenticated public HTTP(S) URL to an institution pack.
2. Reuse the existing parser where possible; otherwise extend the relevant API source adapter.
3. Add deterministic parser and response tests, including malformed input and partial-source failure where applicable.
4. Verify the pack and affected API package, then run pnpm verify.

Never add authenticated URLs, internal hostnames, tokens, captured user data, or protected-system content. This repository does not contain or define private connector stubs.
