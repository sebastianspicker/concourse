# API

@concourse/api is the Node.js backend-for-frontend for public campus data. It loads one institution pack, fetches only public web pages and ICS feeds, and returns validated responses for the Expo client.

## Run

From the repository root:

~~~bash
cp apps/api/.env.example apps/api/.env
INSTITUTION_ID=hfmt pnpm --filter @concourse/api dev
~~~

For the compiled entry point:

~~~bash
pnpm --filter @concourse/api build
INSTITUTION_ID=hfmt pnpm --filter @concourse/api start
~~~

The API provides GET /health, /events, /rooms, /schedule, and /today. See [the runbook](../../docs/runbook.md) for environment validation, response state, proxy trust, and troubleshooting.

## Structure

- src/application/ contains transport-neutral public-data use cases.
- src/http/ owns the listener, routes, response headers, and JSON boundary.
- src/runtime/ owns configuration, cache, pack loading, logging, and HTTP.
- src/security/ owns auth, CORS, forwarding trust, rate limiting, and headers.
- src/sources/ owns public web-event and ICS parsing.

There are no private connector stubs in this package. Tests must use deterministic inputs or mocked HTTP and must not require protected or live campus systems.

~~~bash
pnpm --filter @concourse/api test
pnpm --filter @concourse/api typecheck
~~~
