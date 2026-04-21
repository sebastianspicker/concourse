# BFF

Public backend-for-frontend for the Campus App Kit. It exposes only public data sources and stubbed connectors.

## Endpoints

- `GET /health` - liveness check
- `GET /events` - public events from the institution pack
- `GET /rooms` - public rooms from the institution pack
- `GET /schedule` - public schedule (ICS) if configured
- `GET /today` - combined events + rooms

## Running locally

```bash
INSTITUTION_ID=hfmt pnpm --filter @campus/bff dev
```

Environment variables:

- `INSTITUTION_ID` (required, e.g. `hfmt`)
- `BFF_PORT` (optional, default `4000`)
- `CORS_ORIGINS` (optional, comma-separated; use `*` for development)
- `BFF_TRUST_PROXY` (optional, default `auto`; `auto` trusts forwarded headers only for private/loopback peers, `always` always trusts, `never` never trusts)

## Connector model

Public connectors live in `src/connectors/public/`.
Private connectors are defined as interfaces and stubs in `src/connectors/private-stubs/`.
Real implementations belong in a private repo.

## Tests

From the repo root:

```bash
pnpm --filter @campus/bff test
```

## Troubleshooting

### Empty or missing data
If an endpoint returns an empty array or a 404/not_found for data routes:
1. Check `INSTITUTION_ID` and ensure the corresponding institution pack in `@campus/institutions` has `publicSources` (for events/schedules) or `publicRooms` configured.
2. Check the logs for `public_events_source_failed` or `public_schedule_source_failed` warnings.
3. Verify that the upstream HTML or ICS sources are accessible from the BFF.
4. For `/today`, ensure there are events occurring on the current server date.

For more details, see `docs/runbook.md`.
