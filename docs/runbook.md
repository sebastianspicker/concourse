# Runbook

## Local operation

~~~bash
corepack pnpm@9.15.0 install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
cp apps/client/.env.example apps/client/.env
~~~

Start the API, then the client in another terminal:

~~~bash
INSTITUTION_ID=hfmt pnpm --filter @concourse/api dev
INSTITUTION_ID=hfmt pnpm --filter @concourse/client start
~~~

dev for the client requires an installed compatible development client. EXPO_PUBLIC_BFF_BASE_URL must point to an address reachable by the simulator, browser, emulator, or device. Plain HTTP is accepted only on loopback; use an HTTPS tunnel or locally trusted HTTPS proxy for physical-device development.

## Configuration

| API variable | Behavior |
|---|---|
| INSTITUTION_ID | Required and must resolve through the institution registry. |
| BFF_PORT | Integer 1–65535; default 4000. |
| CORS_ORIGINS | Optional comma-separated origins; no origins are allowed by default. |
| BFF_DEFAULT_CACHE_TTL | Integer 1–86400 seconds; default 300. |
| RRULE_EXPANSION_HORIZON_DAYS | Integer 1–366 days; default 90. |
| BFF_REQUIRE_AUTH / BFF_AUTH_TOKEN | Optional bearer guard and its required secret. |
| BFF_TRUSTED_PROXIES | Optional exact IP/CIDR allowlist for forwarded identity. |
| BFF_TRUST_PROXY | never by default; accepts never or always. |

BFF_TRUSTED_PROXIES enables trusted-proxy mode if no explicit mode overrides it. always trusts client-supplied forwarding headers and is appropriate only behind an isolated edge that replaces them.

| Client variable | Behavior |
|---|---|
| EXPO_PUBLIC_BFF_BASE_URL | API URL; required for API-backed runtime and HTTPS-only for release builds. |
| INSTITUTION_ID | Required for preview/production; aligns the client with the API pack. |
| MOBILE_BUNDLE_IDENTIFIER | Required for production iOS builds. |
| MOBILE_ANDROID_PACKAGE | Required for production Android builds. |

## Endpoints and response state

| Endpoint | Behavior |
|---|---|
| GET /health | Process, selected-pack, uptime, and memory status; no upstream probe. |
| GET /events | Normalized public events. |
| GET /rooms | Pack-defined public rooms. |
| GET /schedule | Normalized public ICS occurrences. |
| GET /today | Campus-local events and rooms; accepts date=YYYY-MM-DD. |

/health has Cache-Control: no-store; it returns 200 for ok/warning and 503 for error. Missing route data returns 404 not_found. Partial event or schedule responses can include _degraded: true and x-data-degraded: true; the client does not cache those results. Responses include x-request-id and data responses identify their pack with x-institution-id.

## Verification

~~~bash
pnpm lint
pnpm check:architecture
pnpm typecheck
pnpm test
pnpm build
pnpm verify
~~~

pnpm check:architecture enforces the workspace dependency and client-to-API source-import boundary. Workspace builds clear generated dist output before compilation. pnpm verify is the complete local source-candidate gate. It does not test a deployed API, remote source reachability, EAS, signing, or device accessibility.

## Troubleshooting

| Symptom | Check |
|---|---|
| API exits at startup | Use a known INSTITUTION_ID; inspect configuration validation. |
| Client cannot reach the API | Set a reachable EXPO_PUBLIC_BFF_BASE_URL; check port and CORS. |
| Institution mismatch | Use the same INSTITUTION_ID in API and client configuration. |
| Route returns 404 | Check the selected pack has the corresponding public sources or rooms. |
| Data is degraded | Inspect API logs and fetch the configured public source from the API host. |
| Shared client rate-limit bucket | Use exact BFF_TRUSTED_PROXIES; avoid always on exposed APIs. |
| Frozen install fails | Run pnpm install only after an intentional dependency change and review the lockfile. |

Use x-request-id to correlate client-visible failures with structured API logs. Do not put source URLs containing sensitive material, tokens, or personal data in issues, logs, or test inputs.
