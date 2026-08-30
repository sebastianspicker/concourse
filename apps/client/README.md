# Client

@concourse/client is the Expo Router application for native and responsive web. It consumes the Concourse API only, validates public responses, and keeps a labeled persisted cache for offline and degraded operation.

## Run

From the repository root:

~~~bash
cp apps/client/.env.example apps/client/.env
INSTITUTION_ID=hfmt pnpm --filter @concourse/client start
~~~

Set EXPO_PUBLIC_BFF_BASE_URL in apps/client/.env to a URL reachable by the target client and run the API with the same INSTITUTION_ID in another terminal. Use dev only when a compatible development client is installed:

~~~bash
INSTITUTION_ID=hfmt pnpm --filter @concourse/client dev
~~~

## Structure

- app/ contains Expo Router routes and the local health route.
- src/shell/ contains shared app chrome and boundary components.
- src/data/public/ owns API-backed resources, static-demo data, and cache use.
- src/design-system/ owns theme and reusable UI primitives.
- src/features/ composes route-oriented screens.
- src/platform/ owns environment, HTTP, storage, network, and sharing edges.

CONCOURSE_STATIC_DEMO=1 enables fixture-only static export behavior. It must not call the API or external sources. Preview and production requirements are in [client deployment](../../docs/deploy/mobile.md).

~~~bash
pnpm --filter @concourse/client test
pnpm --filter @concourse/client typecheck
~~~
