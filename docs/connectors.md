# Public sources

The API loads one institution pack and reads only the sources that pack
configures. Everything it accepts is public and credential-free.

| Route | Input |
|---|---|
| `/events` | Public HTTP(S) pages in `publicSources.events` |
| `/schedule` | Public ICS feeds in `publicSources.schedules` |
| `/rooms` | `publicRooms` in the pack |
| `/today` | Same-day public events and pack-defined rooms |

The source adapters live in `apps/api/src/sources/web-events/` and
`apps/api/src/sources/ics/`. They normalize upstream data into the public
resource schemas in `packages/contracts/src/resources/`.

## When a source fails

- Fetches have bounded timeouts, and failures are logged with request context.
- If at least one event or schedule source succeeds, the API can return partial
  data with `_degraded: true`.
- Degraded source results are not inserted into the API's in-process source
  cache. A successful HTTP response still carries private cache headers, so the
  client may persist a validated degraded response for bounded offline use.
- If configured event pages yield no parsed events, the events adapter returns
  source-label fallback records with `_degraded: true`. If every configured
  schedule source fails, the API returns a sanitized error.
- ICS recurrence expansion is bounded by `RRULE_EXPANSION_HORIZON_DAYS`.

Tests set `PUBLIC_EVENTS_MODE=mock` to derive deterministic event records from
the configured source labels without fetching them, and `PUBLIC_EVENTS_DATE` to
fix the event and Today clock. Do not set either value in production: live
behavior uses the default `auto` mode and the real clock.

## Add a public source

1. Add an unauthenticated public HTTP(S) URL to an institution pack.
2. Reuse an existing parser where you can; otherwise extend the relevant API
   source adapter.
3. Add deterministic parser and response tests, including malformed input and
   partial-source failure.
4. Verify the pack and the affected API package, then run `pnpm verify`.

Never add authenticated URLs, internal hostnames, tokens, captured user data, or
protected-system content. This repository contains no private connector code.
