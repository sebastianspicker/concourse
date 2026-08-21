# Concourse Campus Kit

Concourse Campus Kit is a TypeScript workspace for presenting public university
information. It contains an Expo application, a Node.js backend-for-frontend
(BFF), shared Zod schemas, and public institution configuration.

[Open the static Concourse demo](https://sebastianspicker.github.io/concourse/).
It uses fictional sample data; actions marked “Simulated” do not call campus
services, open external sources, share content, or delete browser data.

The current version is `1.2.0-alpha.1`. This checkout is a source candidate. It
does not include a hosted service, signed mobile application, EAS project,
store listing, private connector implementation, or user authentication flow.

## Capabilities

- Today, Events, Rooms, Settings, event detail, room detail, and schedule detail
  routes for native and responsive web targets
- Public HTML event and ICS schedule ingestion through the BFF
- Institution-defined public rooms, identity, locale, timezone, accent, and
  layout preset
- Shared response validation in the BFF and client
- Client-side persisted caching with current, cached, degraded, offline, empty,
  and error states
- English and German text plus system, light, dark, and high-contrast appearance
- BFF caching, request timeouts, bounded recurrence expansion, circuit breaking,
  rate limiting, CORS, request IDs, security headers, and optional bearer auth
- Direct Vitest contracts for public schemas, institution packs, BFF auth,
  response headers, and ICS parsing

## Limitations

- The client requires a reachable BFF and does not fetch campus sources directly.
- Public connectors depend on upstream HTML and ICS formats.
- Private schedules, room occupancy, protected campus systems, SSO, and student
  data are outside this repository.
- The included bearer token guard is a deployment option for a private or
  network-restricted BFF. It is not a user authentication system.
- `ios/` and `android/` projects, signing configuration, EAS linkage, and native
  binaries are not checked in.
- Native screen readers, native text scaling, device orientation, and browser
  engines require separate owner-managed checks before distribution.
- Workspace packages are private and are not published to a package registry.

## Requirements

- Node.js 22.13 or newer. CI uses 22.13.0 and [`.nvmrc`](.nvmrc) records that version.
- Corepack
- pnpm 9.15.0, selected through Corepack
- Expo Go or an institution-owned development client for device testing
- Docker only for the container workflows

## Installation

From the repository root:

```bash
corepack pnpm@9.15.0 install --frozen-lockfile
cp apps/bff/.env.example apps/bff/.env
cp apps/mobile/.env.example apps/mobile/.env
```

The setup script performs the frozen install, creates missing local environment
files without overwriting existing files, builds the workspace, and runs the
type checker:

```bash
corepack pnpm@9.15.0 setup:dev
```

## Configuration

Use the same institution ID in the BFF and mobile application.

| Runtime | Required values |
|---|---|
| BFF | `INSTITUTION_ID` |
| Local mobile development | `EXPO_PUBLIC_BFF_BASE_URL`; set `INSTITUTION_ID` when the BFF does not use `example` |
| EAS preview | `INSTITUTION_ID`, `EXPO_PUBLIC_BFF_BASE_URL` |
| EAS production | Preview values plus `MOBILE_BUNDLE_IDENTIFIER` and `MOBILE_ANDROID_PACKAGE` |

The bundled institution IDs are `example`, `hfmt`, and `mockuni`.
`mockuni` is a deterministic static-preview pack. Institution packs live in
[`packages/institutions/src/packs/`](packages/institutions/src/packs/).

BFF options:

| Variable | Default | Purpose |
|---|---:|---|
| `BFF_PORT` | `4000` | Listening port |
| `CORS_ORIGINS` | none | Comma-separated allowed origins |
| `BFF_DEFAULT_CACHE_TTL` | `300` | Public source cache TTL in seconds, from 1 to 86400 |
| `RRULE_EXPANSION_HORIZON_DAYS` | `90` | ICS recurrence horizon, from 1 to 366 days |
| `BFF_REQUIRE_AUTH` | disabled | Enables the bearer token guard for `1`, `true`, `yes`, or `on` |
| `BFF_AUTH_TOKEN` | none | Required when bearer auth is enabled |
| `BFF_TRUSTED_PROXIES` | none | Comma-separated proxy IP addresses or CIDR ranges |
| `BFF_TRUST_PROXY` | `never` | `never`, `always`, or implicit `trusted` through `BFF_TRUSTED_PROXIES` |

`PUBLIC_EVENTS_MODE` and `PUBLIC_EVENTS_DATE` are static-preview controls. Do
not set them in a normal deployment.

See [Runbook](docs/runbook.md#configuration) for validation rules and proxy behavior.

## Usage

Set `EXPO_PUBLIC_BFF_BASE_URL` in `apps/mobile/.env` to an address reachable by
the target browser, simulator, emulator, or device.

Run the BFF and Expo Go in separate terminals:

```bash
# Terminal 1
INSTITUTION_ID=hfmt corepack pnpm@9.15.0 --filter @concourse/bff dev

# Terminal 2
INSTITUTION_ID=hfmt corepack pnpm@9.15.0 --filter @concourse/mobile start
```

For an installed development client, replace `start` with `dev`.

The BFF exposes:

- `GET /health`
- `GET /events`
- `GET /rooms`
- `GET /schedule`
- `GET /today`

`GET /today` accepts an optional `date=YYYY-MM-DD` query parameter. Data routes
return `404 not_found` when the selected pack has no source for that route.
Partial public-source results include `_degraded: true` and
`x-data-degraded: true`.

## Repository structure

```text
apps/
  bff/            Node.js BFF, public connectors, and private extension stubs
  mobile/         Expo Router application
packages/
  institutions/  Public institution packs
  shared/        Shared schemas and domain types
docs/             Architecture, operations, deployment, and UI references
infra/            Local Docker Compose configuration
scripts/          Setup, validation, release, and test helpers
```

Key entry points:

- BFF server: [`apps/bff/src/server.ts`](apps/bff/src/server.ts)
- Mobile routes: [`apps/mobile/app/`](apps/mobile/app/)
- Public response schemas: [`packages/shared/src/domain/public.ts`](packages/shared/src/domain/public.ts)
- Institution registry: [`packages/institutions/src/packs.ts`](packages/institutions/src/packs.ts)

## Development workflow

Use root commands so Turbo runs packages in dependency order.

| Command | Result |
|---|---|
| `pnpm lint` | ESLint for root files and all packages |
| `pnpm typecheck` | Root tool config and package TypeScript checks |
| `pnpm test` | Direct package contract tests |
| `pnpm build` | Shared packages, institution packs, BFF, and mobile TypeScript build |
| `pnpm release:check` | Version, Expo identity, and changelog checks |
| `pnpm verify` | Complete source-candidate gate |

No formatter is configured. ESLint checks code-quality rules for the configured
source and configuration files; it does not lint Markdown.

## Testing

The default verification command is:

```bash
pnpm verify
```

It performs a frozen install unless `SKIP_INSTALL=1`, checks release metadata
and the tracked public tree, runs lint, type checks, direct contract tests,
builds, screenshot-set checks, and a source marker scan.

## Static demo and GitHub Pages

The static demo uses only the fictional `example` institution pack. It does
not contact the BFF, campus services, or external sources, and controls marked
`Simulated` do not share content or delete browser data.

After installing the declared dependencies, build and validate the exact Pages
artifact with:

```bash
pnpm build:demo
pnpm verify:demo:artifact
PORT=8082 node scripts/serve-pages-output.mjs dist-pages
```

Open <http://127.0.0.1:8082/concourse/>. Rebuild `dist-pages/`
before treating it as evidence for current source; a previously generated
artifact can still pass structural validation after source changes.

The Pages workflow publishes `dist-pages/` beneath `/concourse/`. It is a
static product walkthrough, not a hosted BFF, authenticated campus service,
or signed mobile application. A successful local build does not prove a
remote Pages deployment.

## Deployment and operation

- [BFF deployment](docs/deploy/bff.md) covers the production Docker image,
  runtime variables, health checks, and reverse proxies.
- [Mobile deployment](docs/deploy/mobile.md) covers EAS profiles and required
  owner-managed values.
- [Release process](docs/release.md) covers version tags, the GHCR image, and
  GitHub Releases.
- [Runbook](docs/runbook.md) covers local operation and failure diagnosis.

The tag workflow publishes a versioned BFF image and a GitHub Release after
validation. It does not build mobile binaries. Prereleases do not update the
`latest` image tag.

## Troubleshooting

| Symptom | Check |
|---|---|
| BFF exits at startup | Set a known `INSTITUTION_ID` and check environment validation output |
| Client reports a missing BFF URL | Set `EXPO_PUBLIC_BFF_BASE_URL` to a reachable HTTP(S) origin |
| Client reports an institution mismatch | Use the same institution ID for the BFF and mobile build |
| Data route returns `404 not_found` | Confirm the selected pack configures that source or room list |
| Response is degraded or unavailable | Check BFF logs and the configured public upstream |
| All proxied clients share a rate-limit bucket | Configure exact values in `BFF_TRUSTED_PROXIES` |
| Lockfile validation fails | Run `pnpm install`, review `pnpm-lock.yaml`, then retry with `--frozen-lockfile` |

More detail is available in [Runbook](docs/runbook.md#troubleshooting).

## Security considerations

Only public source URLs and sanitized static-preview data belong in this repository. Do
not commit credentials, private endpoints, protected campus data, signing
material, or logs containing personal data.

Keep `BFF_TRUST_PROXY=never` unless the deployment has a reviewed proxy
boundary. Prefer an exact `BFF_TRUSTED_PROXIES` allowlist over `always`. Store
bearer tokens and signing keys in deployment secret storage.

Report vulnerabilities through the private channel described in
[SECURITY.md](SECURITY.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a change and
[SUPPORT.md](SUPPORT.md) before opening an issue. Pull requests should include
tests for behavior changes, documentation for changed contracts, and the
relevant verification results.

## Additional documentation

- [Architecture](docs/architecture.md)
- [Institution packs](docs/institutions.md)
- [Connectors](docs/connectors.md)
- [Frontend conventions](docs/frontend.md)
- [Design reference](DESIGN.md)
- [CI](docs/ci.md)

## License

This repository is licensed under the MIT License. See [LICENSE](LICENSE).
