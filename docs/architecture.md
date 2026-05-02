# Architecture

This repo ships a public Campus App template with a small BFF (backend-for-frontend). The BFF exposes only public data sources and stubbed connectors.

## High-level overview

```mermaid
flowchart LR
  subgraph Client["Mobile (Expo)"]
    App[App UI]
    Cache[Client cache]
    App --> Cache
  end
  subgraph BFF["BFF"]
    Routes[Routes]
    Connectors[Connectors]
    Inst[Institution pack]
    Routes --> Connectors
    Routes --> Inst
  end
  subgraph Sources["Public sources"]
    Web[Websites]
    ICS[ICS feeds]
  end
  App -->|GET /events, /today, etc.| BFF
  BFF --> Web
  BFF --> ICS
  BFF -->|JSON| App
```

## Why a BFF

- Shield the app from scraping logic and rate limits.
- Normalize data into a shared domain model.
- Keep sensitive connectors out of the public repo.

## Core pieces

- **Mobile app** – Expo + Expo Router (tabs, events, rooms, schedule).
- **BFF** – Public connectors + private stubs; rate limiting, caching, CORS, circuit breaker, security headers.
- **Shared** – Domain types, Zod schemas, and discriminated union error types (`packages/shared`).
- **Institution packs** – Public data only (`packages/institutions`).

## Public vs private

```mermaid
flowchart TB
  subgraph PublicRepo["Public repo (this)"]
    PublicConn[Public connectors]
    Packs[Institution packs]
    Stubs[Private stubs]
  end
  subgraph PrivateRepo["Private repo (fork)"]
    RealConn[Real connectors]
    SSO[SSO/OIDC]
    PrivateAPI[Private APIs]
  end
  PublicConn --> Packs
  Stubs -.->|implement| RealConn
  RealConn --> SSO
  RealConn --> PrivateAPI
```

| In this repo | In a private fork |
|--------------|-------------------|
| Public website / ICS data | Real connectors (SSO, sessions, scraping) |
| Institution packs (public info only) | Private endpoints and ops |
| Interfaces and stubs for private connectors | Caching, rate limits, monitoring |

## Data flow

```mermaid
sequenceDiagram
  participant App as Mobile app
  participant BFF as BFF
  participant Conn as Connectors
  participant Ext as External sources

  App->>BFF: GET /today or /events
  BFF->>BFF: Load institution pack
  BFF->>Conn: fetchPublicEvents / fetchPublicSchedule
  Conn->>Ext: HTTP (websites, ICS)
  Ext-->>Conn: HTML / ICS
  Conn-->>BFF: Normalized events/schedule
  BFF-->>App: JSON (Cache-Control, optional _degraded)
  App->>App: Render + brief client cache
```

1. Mobile app requests `/today` or `/events` (or `/rooms`, `/schedule`) from the BFF.
2. BFF reads the institution pack and calls public connectors.
3. Responses are normalized into shared domain models (Zod-validated).
4. Mobile app renders the data and caches briefly (e.g. `getCachedJson`).

## Runtime invariants

- `INSTITUTION_ID` selects exactly one public institution pack at BFF startup. Unknown ids fail startup or route handling instead of silently falling back to another pack.
- Data routes return `404 not_found` when the selected pack has no source configured for that route. That is different from an empty but valid upstream result.
- Public event and schedule connectors may return `_degraded: true` plus `x-data-degraded: true` when at least one configured source failed but some usable data remains.
- Degraded connector results are intentionally not cached in the BFF; the next request should be able to recover as soon as the upstream source recovers.
- Shared Zod schemas in `packages/shared` are the cross-layer contract. The BFF validates outbound payloads against them, and the mobile client validates inbound payloads against the same schemas.
- Dates from public sources are normalized to ISO strings with offsets. Institution packs may set `timezone`; otherwise the BFF uses `Europe/Berlin` for campus-local date handling.

## Expo API Routes

The mobile app can also expose server-side API routes using Expo Router's `+api.ts` convention (files under `apps/mobile/app/` with the `+api.ts` suffix). These run on the dev server in development and on EAS Hosting in production.

Use Expo API routes when you need server-side secrets, third-party API proxies, webhooks, or server-side validation that belongs with the app deployment. Prefer the BFF when you need institution-specific public data, a shared backend for multiple clients, or independent deployment (Docker, Kubernetes).

Provided routes: `GET /api/hello` (demo) and `GET /api/health` (health check). Requires `web.output: "server"` in `app.config.ts`.

## Key files

| Layer | Location |
|-------|----------|
| BFF server | `apps/bff/src/server.ts`, `apps/bff/src/routes/` |
| BFF connectors | `apps/bff/src/connectors/public/`, `.../private-stubs/` |
| Shared schemas | `packages/shared/src/domain/` |
| Institution packs | `packages/institutions/src/packs/` |
| Mobile data | `apps/mobile/src/data/publicApi.ts`, `.../cache.ts` |
| Mobile UI | `apps/mobile/src/ui/`, `apps/mobile/app/` |
