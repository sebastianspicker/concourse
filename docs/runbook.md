# Runbook

## Local operation

Install from the repository root:

```bash
corepack pnpm@9.15.0 install --frozen-lockfile
```

Create local configuration:

```bash
cp apps/bff/.env.example apps/bff/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Run the BFF:

```bash
INSTITUTION_ID=hfmt pnpm --filter @concourse/bff dev
```

Run Expo Go in another terminal:

```bash
INSTITUTION_ID=hfmt pnpm --filter @concourse/mobile start
```

Use `pnpm --filter @concourse/mobile dev` only when a compatible development
client is already installed. The repository does not include that binary.

## Configuration

### BFF

| Variable | Validation and behavior |
|---|---|
| `INSTITUTION_ID` | Required. Must match a key in `packages/institutions/src/packs.ts`. |
| `BFF_PORT` | Optional. Integer from 1 to 65535. Default `4000`. |
| `CORS_ORIGINS` | Optional comma-separated origins. No origins are allowed by default. `*` is suitable only for development. |
| `BFF_DEFAULT_CACHE_TTL` | Optional integer from 1 to 86400 seconds. Default `300`. |
| `RRULE_EXPANSION_HORIZON_DAYS` | Optional integer from 1 to 366 days. Default `90`. |
| `BFF_REQUIRE_AUTH` | Optional. `1`, `true`, `yes`, and `on` enable auth. Unset, `0`, `false`, `no`, and `off` disable it. Other non-empty values fail validation. |
| `BFF_AUTH_TOKEN` | Required when `BFF_REQUIRE_AUTH` enables auth. Protect it as a secret. |
| `BFF_TRUSTED_PROXIES` | Optional comma-separated IP addresses or CIDR ranges. Enables trusted-proxy mode when `BFF_TRUST_PROXY` is unset. |
| `BFF_TRUST_PROXY` | Optional. Default `never`. Accepts `never` or `always`; `auto` and boolean aliases are rejected. |
| `APP_VERSION` | Optional image or deployment version reported by `/health`. |

`BFF_TRUSTED_PROXIES` is the preferred proxy configuration. The BFF accepts
forwarding headers only when the immediate peer is allowlisted, then walks the
chain from right to left through known proxies. Invalid chains and untrusted
peers use the socket address.

`BFF_TRUST_PROXY=always` trusts forwarding headers from every peer. Use it only
when the BFF is isolated behind an edge that replaces all forwarding headers.

### Mobile application

| Variable | Validation and behavior |
|---|---|
| `EXPO_PUBLIC_BFF_BASE_URL` | Required by the running client. Preview and production config require a valid HTTP(S) URL. |
| `INSTITUTION_ID` | Required for preview and production. Local development defaults to `example`. |
| `EXPO_PUBLIC_INSTITUTION_ID` | Build-time fallback when `INSTITUTION_ID` is not set. Prefer `INSTITUTION_ID`. |
| `MOBILE_BUNDLE_IDENTIFIER` | Required for production. Template identifiers are rejected. |
| `MOBILE_ANDROID_PACKAGE` | Required for production. Template identifiers are rejected. |

The BFF and mobile application must use the same institution ID. When the BFF
returns `x-institution-id`, the client rejects a mismatch.

## Endpoint behavior

| Endpoint | Behavior |
|---|---|
| `GET /health` | Process, version, selected institution, pack loading, uptime, and heap status. Does not probe upstream sources. |
| `GET /events` | Normalized public events from configured HTML sources. |
| `GET /rooms` | Public rooms declared by the selected institution pack. |
| `GET /schedule` | Normalized occurrences from configured public ICS sources. |
| `GET /today` | Events for a campus-local date plus public rooms. Accepts `date=YYYY-MM-DD`. |

`/health` returns 200 for `ok` and `warning`, 503 for `error`, and
`Cache-Control: no-store`. Bearer auth, when enabled, also protects `/health`.

Data routes return `404 not_found` when the selected pack has no source for the
route. Partial event or schedule results can include `_degraded: true` and the
`x-data-degraded: true` response header. Degraded BFF results are not cached.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run the complete local gate with:

```bash
pnpm verify
```

No formatter is configured. `pnpm lint` checks code-quality rules for the
configured source and configuration files; it does not lint Markdown.

## Logs and request IDs

The BFF writes structured log records. Each response includes
`x-request-id`. A valid incoming `x-request-id` is retained; otherwise the
server creates one. Use this value to correlate route errors with server logs.

The BFF logs public source failures without returning internal error details to
clients. `/health` does not establish that public event or schedule sources are
reachable.

## Troubleshooting

### The BFF does not start

- Confirm Node is at least 22.13 and the install used pnpm 9.15.0.
- Confirm `INSTITUTION_ID` is `example`, `hfmt`, `mockuni`, or a newly registered pack.
- Check numeric ranges for `BFF_PORT`, `BFF_DEFAULT_CACHE_TTL`, and
  `RRULE_EXPANSION_HORIZON_DAYS`.
- If auth is enabled, set a non-empty `BFF_AUTH_TOKEN`.
- Remove invalid entries from `BFF_TRUSTED_PROXIES`.

### The client cannot reach the BFF

- Set `EXPO_PUBLIC_BFF_BASE_URL` in `apps/mobile/.env`.
- Use an address reachable from the target device. A physical device usually
  cannot use the development machine's `localhost`.
- Confirm the BFF port and `CORS_ORIGINS`.
- Confirm the client and BFF use the same institution ID.

### A data route returns 404

Inspect the selected pack in `packages/institutions/src/packs/`. Events require
`publicSources.events`, schedules require `publicSources.schedules`, and rooms
require `publicRooms`. Today requires at least an event source or a room list.

### Data is empty or degraded

- Check the configured source URL from the BFF host.
- Check BFF logs for public fetch or parse failures.
- Confirm event timestamps fall on the requested institution-local date.
- Confirm the institution timezone is a valid IANA timezone.

### Rate limiting uses the wrong client address

Keep socket-address behavior with `BFF_TRUST_PROXY=never`, or add the exact
proxy IP addresses and CIDR ranges to `BFF_TRUSTED_PROXIES`. Do not enable
`always` on an exposed BFF.

### Lockfile validation fails

After an intentional dependency change, run `pnpm install` and review the
`pnpm-lock.yaml` diff. Clean checkouts and CI use `--frozen-lockfile`.

## Security checks

If Gitleaks is installed locally:

```bash
gitleaks detect --redact --source . --verbose --config .gitleaks.toml
```

`make gitleaks` runs the pinned containerized scanner. GitHub Actions also runs
Gitleaks, CodeQL, and OSV lockfile analysis. Do not place secrets or private
source URLs in command output, issue reports, or test fixtures.
