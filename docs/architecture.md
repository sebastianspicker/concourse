# Architecture

Concourse separates public-data ingestion from presentation. apps/api loads a schema-validated institution pack, fetches only public web and ICS sources, and returns validated JSON. apps/client consumes that API, validates the same wire contract, and manages local presentation/cache state.

~~~mermaid
flowchart LR
  Pack[Institution pack] --> API[apps/api]
  HTML[Public web pages] --> API
  ICS[Public ICS feeds] --> API
  API -->|validated JSON| Client[apps/client]
  Contracts[packages/contracts] --> API
  Contracts --> Client
  Client --> Cache[Persisted public-data cache]
~~~

| Area | Responsibility |
|---|---|
| packages/contracts | Zod public DTOs and error contract shared by API and client |
| packages/institutions | Public pack schema, branding, bundled packs, and registry |
| apps/api | HTTP listener, security controls, cache, source parsing, and API routes |
| apps/client | Expo routes, public-data hooks, design system, and local cache |
| infra / scripts | Local containers and development, release, and demo automation |

## Dependency direction

packages/contracts has no workspace dependency. packages/institutions depends
on packages/contracts. apps/api and apps/client depend on both packages. The
client reaches apps/api only through HTTP; it never imports API source. The
boundary checker rejects internal-layer violations and workspace dependency
cycles.

## Request flow

1. A client hook requests /events, /rooms, /schedule, or /today through apps/client/src/data/public/.
2. The API applies request IDs, headers, CORS, rate limiting, method checks, and optional bearer authentication.
3. The selected INSTITUTION_ID resolves through the institution registry.
4. The route reads pack-defined rooms or fetches and normalizes public HTML/ICS.
5. The API validates the response against @concourse/contracts before sending it; the client validates it again before updating its cache.

## Runtime behavior

- Unknown institution IDs fail closed.
- A route lacking configured data returns 404 not_found.
- Events and schedules can return partial data with _degraded: true and x-data-degraded: true; degraded responses are not cached.
- The client aborts superseded requests and labels retained cache data rather than treating it as current.
- /health validates process and pack readiness only; it does not probe public upstream sources.
- The API returns x-request-id and identifies selected data with x-institution-id.

The public runtime intentionally has no private connector interfaces or stubs. Protected systems, credentials, SSO, private schedules, student data, and room occupancy require a separate reviewed implementation outside this repository.

## Key paths

| Area | Path |
|---|---|
| API entry point | apps/api/src/server.ts |
| API HTTP boundary | apps/api/src/http/ |
| API source adapters | apps/api/src/sources/ |
| Client routes | apps/client/app/ |
| Client public-data layer | apps/client/src/data/public/ |
| Client transport | apps/client/src/platform/http/ |
| Shared resource and HTTP contracts | packages/contracts/src/resources/ and packages/contracts/src/http/ |
| Institution registry | packages/institutions/src/registry.ts |
