# Campus App Kit

[![CI](https://github.com/sebastianspicker/campus-app-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/sebastianspicker/campus-app-kit/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node 20](https://img.shields.io/badge/node-20.x-green.svg)](.nvmrc)
[![pnpm 9](https://img.shields.io/badge/pnpm-9-orange.svg)](package.json)

A public, privacy-safe starter for building a university campus app with **React Native + Expo** and an optional **Backend-for-Frontend (BFF)**.

---

## Quick Start

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Start BFF and mobile in parallel
INSTITUTION_ID=hfmt pnpm dev
```

Then open the mobile app with a dev client.

For Expo Go, run `pnpm --filter @campus/mobile start` instead of `pnpm dev`.

**Prerequisites:** Node.js 20, pnpm 9. See [Runbook](docs/runbook.md) for detailed setup.

---

## Features

- **Mobile app** – Expo SDK 51 with Expo Router; Today, Events, Rooms, Schedule screens
- **BFF** – Optional Node.js API with public connectors, rate limiting, HTTP caching, CORS, circuit breaker
- **Institution packs** – Public config per institution; easy to add more
- **Shared types** – Zod schemas used by both BFF and mobile

## Mobile App Screenshots (Mock Data)

| Today | Rooms |
|---|---|
| ![Today screen with mock data in dark theme](docs/screenshots/mobile-today-dark.png) | ![Rooms screen with mock data in dark theme](docs/screenshots/mobile-rooms-dark.png) |

| Stage | Profile | Detail |
|---|---|---|
| ![Stage screen with mock events in dark theme](docs/screenshots/mobile-stage-dark.png) | ![Profile screen with theme selection in dark theme](docs/screenshots/mobile-profile-dark.png) | ![Event detail screen with mock data in dark theme](docs/screenshots/mobile-event-detail-dark.png) |

---

## Project Structure

```
apps/
  mobile/         Expo React Native app (Expo Router)
  bff/            Optional BFF API (public connectors + private stubs)
packages/
  shared/         Domain types + Zod schemas
  institutions/   Public institution packs
docs/             Architecture, runbook, CI, deployment
```

See [Architecture](docs/architecture.md) for data flow diagrams and design decisions.

---

## Configuration

| Context | Required Variables |
|--------|---------------------|
| **BFF** | `INSTITUTION_ID` (e.g., `hfmt`) |
| **Mobile** | `EXPO_PUBLIC_BFF_BASE_URL` (production builds) |

Additional options: `BFF_PORT`, `CORS_ORIGINS`, `BFF_TRUST_PROXY`. See [Runbook → Configuration](docs/runbook.md#configuration) for full details.

---

## Development Commands

| Command | Description |
|--------|-------------|
| `pnpm dev` | Run BFF + mobile in parallel |
| `pnpm verify` | Full CI check (lint, typecheck, test, build) |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Run tests |
| `pnpm build` | Build all packages |

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Runbook](docs/runbook.md) | Setup, config, commands, troubleshooting |
| [Architecture](docs/architecture.md) | Design overview and diagrams |
| [Connectors](docs/connectors.md) | BFF connectors and stubs |
| [Institutions](docs/institutions.md) | Institution pack configuration |
| [Deploy](docs/deploy/) | Deployment guides (BFF, mobile) |
| [FAQ](docs/faq.md) | Frequently asked questions |

---

## Status

- **Version:** 1.0.0
- **Changelog:** See [CHANGELOG.md](CHANGELOG.md)

---

## Troubleshooting

| Symptom | Typical Cause | Fix |
|--------|---------------|-----|
| Generic 500 on data routes | Connector or Zod throw | Check BFF logs for details |
| BFF fails at startup | Missing `INSTITUTION_ID` | Set `INSTITUTION_ID=hfmt` |
| Mobile "Missing BFF base URL" | Wrong env variable | Set `EXPO_PUBLIC_BFF_BASE_URL` |
| Empty events/rooms/schedule | Missing config or upstream failure | Check `publicSources` / `publicRooms` |
| Rate limit issues | trustProxy / forwarded headers | See runbook for proxy setup |
| Events/schedule wrong time | Timezone/date parsing | ICS TZID and German dates are parsed as local time; check server timezone |

---

## Security & Privacy

- No secrets or private endpoints in this repo
- Public connectors only; private connectors belong in a separate (private) repo
- See [SECURITY.md](SECURITY.md) and [Threat Model](docs/threat-model-lite.md)

---

## Contributing

Contributions welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and run `pnpm verify` before opening a PR.

---

## License

MIT. See [LICENSE](LICENSE).
