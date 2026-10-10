# API

`@concourse/api` is the Node.js backend-for-frontend (BFF) for public campus
data. It loads one institution pack, fetches only public web pages and ICS
feeds, and returns validated responses to the Expo client.

## Run

From the repository root:

~~~bash
test -e apps/api/.env || cp apps/api/.env.example apps/api/.env
INSTITUTION_ID=example pnpm --filter @concourse/api dev
~~~

To run the compiled entry point:

~~~bash
pnpm --filter @concourse/api build
INSTITUTION_ID=example pnpm --filter @concourse/api start
~~~

The API serves `GET /health`, `/events`, `/rooms`, `/schedule`, and `/today`.
The [runbook](../../docs/runbook.md) covers environment validation, response
state, proxy trust, and troubleshooting; [public sources](../../docs/connectors.md)
covers adapter and partial-failure behavior.

## Layout

Dependencies point downward through this list; `pnpm check:architecture`
enforces it.

- `src/server.ts` is the entry point: it loads configuration once, builds the
  request listener, and owns shutdown. `http/routes.ts` binds the source
  adapters to that configuration.
- `src/http/` owns the listener, data routes, query parsing, and health.
  `http/respond.ts` holds the response primitives (errors, request IDs,
  cached JSON, method guard) and imports nothing else from the package.
- `src/security/` owns auth, CORS, forwarding trust, rate limiting, and
  response headers. It may use `http/respond.ts` but no other HTTP module.
- `src/application/` holds pure public-data use cases with no Node, network,
  or environment access.
- `src/sources/` owns public web-event and ICS acquisition and parsing;
  `sources/upstream/` holds the guarded outbound HTTP client, source cache, and
  circuit breakers.
- `src/runtime/` owns process concerns: `config.ts` (the only reader of
  `process.env`), logging, and institution-pack loading.

This package contains no private connector code. Tests must use deterministic
inputs or mocked HTTP, and must not depend on protected or live campus systems.

~~~bash
pnpm --filter @concourse/api test
pnpm --filter @concourse/api typecheck
~~~

On SIGINT or SIGTERM the service drains active requests for up to 10 seconds,
then cleans up cache-owned work. Give containers at least 15 seconds to stop.
Both Dockerfiles assemble a complete production dependency directory with
`pnpm deploy`; run `pnpm verify:containers` for the image gate. See
[API deployment](../../docs/deploy/bff.md).
