# Campus App Kit

pnpm + Turbo monorepo: React Native (Expo) campus app with an optional Node.js BFF.

## Quick Commands

```bash
pnpm install --frozen-lockfile   # Install deps
pnpm dev                         # BFF + mobile in parallel (needs INSTITUTION_ID=hfmt)
pnpm build                       # Build all packages
pnpm lint                        # ESLint across all packages
pnpm typecheck                   # TypeScript check (depends on ^build)
pnpm test                        # Vitest across all packages
pnpm verify                      # Full CI gate: lint + typecheck + test + build + marker check
```

## Monorepo Structure

```
apps/bff/            Node.js BFF — plain http.createServer, no framework
apps/mobile/         Expo 51, Expo Router, NativeWind (Tailwind for RN)
packages/shared/     Zod schemas + domain types (single source of truth)
packages/institutions/  Public config packs per institution
```

Build order: `shared` and `institutions` must build before `bff` and `mobile`.

## Architecture

- **BFF**: Plain `http.createServer` — no Express/Fastify. Routes in `apps/bff/src/routes/`, connectors in `apps/bff/src/connectors/`. Includes rate limiting, CORS, HTTP caching, circuit breaker, security headers.
- **Mobile**: Expo Router for navigation, NativeWind for styling, custom hooks in `apps/mobile/src/hooks/`. Fetch layer with exponential backoff + jitter in `apps/mobile/src/api/`.
- **Shared**: Zod schemas in `packages/shared/src/domain/`. Types are always `z.infer<typeof Schema>` — never hand-written duplicates. Discriminated union error types (`ErrorKind`) in `packages/shared/src/domain/errors.ts`.

## Key Conventions

- Zod schemas are the single source of truth for all domain types
- Immutable data patterns — create new objects, never mutate
- All errors use discriminated union `ErrorKind` from `@campus/shared`
- BFF connectors use `fetchWithTimeout` (AbortController, 10s default) + circuit breaker
- BFF cache has TTL + LRU eviction (`apps/bff/src/utils/cache.ts`)
- Mobile retry uses exponential backoff with jitter (`apps/mobile/src/api/retry.ts`)

## Testing

- **Framework**: Vitest for unit + integration; supertest for BFF API tests; Detox for E2E
- **Mobile vitest config** overrides PostCSS with empty plugins (NativeWind compatibility) — see `apps/mobile/vitest.config.ts`
- Run single package: `pnpm --filter @campus/bff test`

## Common Pitfalls

- Must set `INSTITUTION_ID` env var before running BFF (e.g., `INSTITUTION_ID=hfmt`)
- Build `shared` + `institutions` before running `typecheck` or `test` (Turbo handles this via `dependsOn: ["^build"]`)
- Mobile vitest needs the PostCSS override in `apps/mobile/vitest.config.ts` or tests fail on CSS imports
- The `pnpm verify` script also checks for leftover task markers in source files
