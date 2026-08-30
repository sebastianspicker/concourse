# Concourse Campus Kit

Concourse is a TypeScript workspace for presenting public university information. A Node.js API reads a selected institution pack, normalizes public campus web pages and ICS feeds, and returns validated JSON to an Expo client for native and web. The client retains public data locally and makes its current, cached, degraded, offline, empty, unavailable, and error states visible.

[Open the static demo](https://sebastianspicker.github.io/concourse/). It uses the fictional example pack only. It does not call the API, campus services, or external sources; controls marked “Simulated” do not perform the corresponding real-world action.

## Scope

The public product includes Today, Events, Rooms, Schedule, Settings, and available detail routes. It supports public HTTP(S) event pages, public ICS calendar feeds, and pack-defined rooms.

It does not include protected connectors, credentials, SSO, user accounts, personalized schedules, room occupancy, hosted infrastructure, EAS project linkage, signing material, or store submissions. The API is the client's only campus-data boundary; the client does not fetch campus sources directly.

## Requirements and setup

- Node.js 22.13 or newer (the exact CI version is in [.nvmrc](.nvmrc))
- Corepack and pnpm 9.15.0
- Expo Go or an institution-owned development client for device testing
- Docker only for container workflows

From the repository root:

~~~bash
corepack pnpm@9.15.0 install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
cp apps/client/.env.example apps/client/.env
~~~

pnpm setup:dev performs that frozen install, creates missing environment files without overwriting them, builds the workspace, and type-checks it.

## Run locally

Set a valid INSTITUTION_ID in apps/api/.env and an API URL reachable from the target device in apps/client/.env:

~~~dotenv
EXPO_PUBLIC_BFF_BASE_URL=http://localhost:4000
~~~

Start the API and Expo client in separate terminals:

~~~bash
INSTITUTION_ID=hfmt pnpm --filter @concourse/api dev
INSTITUTION_ID=hfmt pnpm --filter @concourse/client start
~~~

Use pnpm --filter @concourse/client dev only with an installed compatible development client. Plain HTTP is limited to loopback development; a physical device needs an HTTPS tunnel or a locally trusted HTTPS proxy to the development API.

The API exposes GET /health, /events, /rooms, /schedule, and /today. /today accepts date=YYYY-MM-DD. Data routes return 404 not_found when the selected pack has no supporting source; partial event and schedule results carry _degraded: true and x-data-degraded: true.

## Architecture

~~~text
public HTML / public ICS / pack-defined rooms
                 │
                 ▼
apps/api ── validates and normalizes ──► typed JSON
                 │                         │
packages/institutions ◄────────────────────┘
                 │
packages/contracts ◄────────────────────────► apps/client (Expo + local cache)
~~~

| Area | Responsibility |
|---|---|
| packages/contracts | Zod schemas, public DTOs, and API error contract |
| packages/institutions | Public pack schema, branding, bundled packs, and registry |
| apps/api | HTTP API, source fetch/parse, cache, security controls, and health |
| apps/client | Expo routes, design system, client transport, cache, and status UI |
| infra / scripts | Local containers, setup, verification, release, and demo tooling |

The bundled IDs are example, hfmt, and mockuni. Packs live in [packages/institutions/src/packs/](packages/institutions/src/packs/).

## Configuration

INSTITUTION_ID is required by the API and should match the client build. The client requires EXPO_PUBLIC_BFF_BASE_URL at runtime; preview and production builds require a credential-free HTTPS origin. See [the runbook](docs/runbook.md) for the complete contract.

| API variable | Default | Purpose |
|---|---:|---|
| BFF_PORT | 4000 | Listening port |
| CORS_ORIGINS | none | Comma-separated allowed origins |
| BFF_DEFAULT_CACHE_TTL | 300 | Public-source cache lifetime in seconds |
| RRULE_EXPANSION_HORIZON_DAYS | 90 | ICS recurrence window in days |
| BFF_REQUIRE_AUTH | disabled | Optional bearer guard for private deployments |
| BFF_AUTH_TOKEN | none | Required only when that guard is enabled |
| BFF_TRUSTED_PROXIES | none | Exact trusted proxy IPs/CIDRs |
| BFF_TRUST_PROXY | never | never, always, or implicit trusted mode |

Keep BFF_TRUST_PROXY=never unless the API is behind a reviewed proxy boundary. Prefer exact BFF_TRUSTED_PROXIES values over always.

## Development and verification

| Command | Result |
|---|---|
| pnpm lint | Root and workspace ESLint checks |
| pnpm check:architecture | Enforced workspace dependency and source-import boundaries |
| pnpm typecheck | Root tooling and workspace TypeScript checks |
| pnpm test | Workspace tests |
| pnpm build | Dependency-ordered workspace build with fresh generated dist output |
| pnpm release:check | Version, Expo identity, and changelog checks |
| pnpm verify | Source-candidate gate |

pnpm verify checks the public tree, architecture boundaries, release metadata, lint, type checks, tests, and fresh builds. It is local source evidence, not proof of a remote deployment, signed native binary, or device validation.

## Static demo and deployment

~~~bash
pnpm build:demo
pnpm verify:demo:artifact
PORT=8082 node scripts/serve-pages-output.mjs dist-pages
~~~

Open <http://127.0.0.1:8082/concourse/>. Rebuild dist-pages/ before using it as source evidence.

- [Architecture](docs/architecture.md)
- [Runbook](docs/runbook.md)
- [Institution packs](docs/institutions.md)
- [Public sources](docs/connectors.md)
- [Client conventions](docs/frontend.md)
- [API deployment](docs/deploy/bff.md)
- [Client deployment](docs/deploy/mobile.md)
- [Release process](docs/release.md)

Report security issues through [SECURITY.md](SECURITY.md). This repository is licensed under the MIT License; see [LICENSE](LICENSE).
