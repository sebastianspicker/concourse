# BFF

The BFF exposes normalized public campus data for the Concourse client.

## Run locally

From the repository root:

```bash
cp apps/bff/.env.example apps/bff/.env
INSTITUTION_ID=hfmt pnpm --filter @concourse/bff dev
```

The development script reads `apps/bff/.env`. The production entry point is:

```bash
pnpm --filter @concourse/bff build
INSTITUTION_ID=hfmt pnpm --filter @concourse/bff start
```

## Endpoints

- `GET /health`
- `GET /events`
- `GET /rooms`
- `GET /schedule`
- `GET /today`

See [`../../docs/runbook.md`](../../docs/runbook.md) for variables, response
behavior, proxy configuration, and troubleshooting.

## Tests

```bash
pnpm --filter @concourse/bff test
pnpm test:e2e
```

Package tests cover routes, middleware, parsers, caching, proxy handling, rate
limits, and server lifecycle. The root E2E command builds the BFF and verifies
public HTTP flows on a temporary port.

## Connector boundary

Public connectors are under `src/connectors/public/`. The modules under
`src/connectors/private-stubs/` are inactive extension interfaces. Protected
connectors and credentials do not belong in this package.
