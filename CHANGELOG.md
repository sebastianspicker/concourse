# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.1.0] - 2026-04-19

### Added

- Unit tests for `authGuard` middleware (all auth paths: pass-through, valid Bearer, missing header, malformed scheme)

### Fixed

- Timezone handling: ICS parser and HTML event scraper now treat times as local instead of UTC when TZID is present or dates are in German format
- `/today` endpoint accepts an optional `date` query parameter so the mobile app can send its local date instead of relying on server UTC
- Mobile hooks (`useEvents`, `useRooms`, `useSchedule`) re-fetch when filter parameters change
- `usePublicResource` resets loading state on re-fetch
- BFF config resolution: `EXPO_PUBLIC_BFF_BASE_URL` is now respected even in dev mode
- Cache timeout timers are cleared after resolution to prevent leaked handles
- BFF sweep interval is `unref()`-ed so Node.js can exit cleanly
- ETag comparison handles comma-separated and `W/`-prefixed values per HTTP spec
- `getNumberParam` rejects `Infinity` and `-Infinity`
- Rate limiter increments count atomically (in-place mutation)
- IPv6 zone IDs stripped for consistent client key comparison
- `getRelativeTimeUnit` avoids returning 0 values by falling back to the next smaller unit
- `persistedCache` JSDoc corrected: function uses network-first strategy, not offline-first
- Today screen day-range filter now recomputes when calendar day changes (was stale past midnight)
- Replace blocking `readFileSync`/`existsSync` with async `fs/promises.readFile` in schedule mock loader

### Changed

- `createJsonRoute` now sets `x-request-id` response header
- Removed internal audit artifacts (`.claude/`, `plans/`, `progress.md`) from version control
- Removed spurious `await` on sync `loadInstitutionPack` calls in BFF server startup
- Removed unused `FilterPanel` component from mobile app
- Removed scaffold placeholder `hello+api.ts` Expo API route
- Rooms list now displays formatted campus names instead of raw IDs (e.g. `"Suedcampus"` instead of `"suedcampus"`)
- Zod schemas for `PublicEvent.date`, `ScheduleItem.startsAt`, and `ScheduleItem.endsAt` now enforce ISO 8601 datetime format

---

## [1.0.0] - 2025-02-25

### Added

#### Features
- ICS RRULE expansion for recurring events in BFF (`rrule` package integration)
- Query parameter filtering for events endpoint (`search`, `from`, `to`, `limit`, `offset`)
- Zod validation schemas for all API inputs and outputs
- Skeleton loading components for mobile app (`Skeleton`, `SkeletonCard`, `SkeletonList`)
- Error state component with retry functionality (`ErrorState`)
- Design tokens in theme system (spacing, typography, shadows)

#### Infrastructure
- Makefile with development targets
- VS Code settings for consistent development experience
- Husky pre-commit hooks with lint-staged
- Release readiness plan documentation

#### Testing
- Expanded BFF integration tests (24 tests covering all endpoints)
- Test suites for: error handling, health, events, rooms, today, rate limiting, security headers, CORS

### Changed

- Improved `ResourceListSection` component with loading and error states
- Updated ESLint configuration
- Reorganized documentation structure

### Fixed

- Import path issues in UI components
- Error response structure consistency across all endpoints

### Removed

- Obsolete documentation files (`BUGS_AND_FIXES_ARCHIVE.md`, `OPEN_IMPROVEMENTS_AND_PLAN.md`)
- Archived `BUGS_AND_FIXES.md`

---

## [0.1.0] - 2024-12-01

### Added

- Initial release
- Mobile app with Expo SDK 51 and Expo Router
- BFF (Backend-for-Frontend) with public connectors
- Institution packs system
- Shared types and Zod schemas
- CI/CD pipeline with GitHub Actions
- Security workflows (CodeQL, Gitleaks, Dependency Review)
- Documentation (architecture, runbook, connectors, FAQ)
- Docker configuration for BFF
- EAS build configuration for mobile

### Features

#### Mobile App
- Today screen with events and rooms
- Events listing and detail screens
- Rooms listing and detail screens
- Schedule screen
- Profile screen
- Error boundary with retry
- Data caching with persistence

#### BFF
- Health check endpoint
- Events endpoint with public connector
- Rooms endpoint with public connector
- Schedule endpoint with ICS parsing
- Today endpoint (combined events + rooms)
- Rate limiting
- HTTP caching
- CORS support
- Security headers

#### Shared Packages
- `@campus/shared` - Domain types and Zod schemas
- `@campus/institutions` - Institution configuration packs

[1.0.0]: https://github.com/example/campus-app-kit/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/example/campus-app-kit/releases/tag/v0.1.0
