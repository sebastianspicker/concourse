# Client conventions

`apps/client` is the Expo Router application for native and responsive web. Its
routes live in `apps/client/app/`, product behavior is defined in
[PRODUCT.md](../PRODUCT.md), and the visual rules are in [DESIGN.md](../DESIGN.md).

## Data and state

Public-data hooks live in `apps/client/src/data/public/` and use the transport
layer in `apps/client/src/platform/http/`. They abort superseded requests, keep
usable rows on screen during a refresh, validate API responses with
`@concourse/contracts`, and coordinate the persisted cache. The resource hooks
are in `resources.ts`; `publicApi.ts` is the single request path. All failure
classification (retry eligibility, cache-fallback and recovery eligibility, and
UI error kinds) lives in `platform/http/`, so new error handling belongs there.

`EXPO_PUBLIC_BFF_BASE_URL` is required for API-backed use. If the API returns
`x-institution-id`, it must match the client's configured institution. The UI has
to tell apart initial loading, current data, cached or offline data, degraded
data, empty data, configuration errors, and request errors. Never show raw
server errors, and never present stale data as current.

`CONCOURSE_STATIC_DEMO=1` selects fixture-only static-demo behavior for the
Pages artifact. It must not contact the API or any external source.

## Design system and layout

- `src/design-system/` owns shared components, tokens, theming (one
  `ThemeProvider.tsx` entry point), and state UI. Components shared by several
  features, such as `SortButton` and `PageHeader`, belong here because features
  cannot import each other.
- `src/shell/` owns shared application chrome and error boundaries.
- `src/features/` owns route-oriented feature composition.
- `src/localization/` owns locale and campus-time presentation.

Do not add remote fonts, a second styling system, or per-screen theme tokens.
The two bundled typefaces live in `apps/client/assets/fonts/` with their OFL
licenses; set type through the `typography` roles in `theme.ts`, which carry the
font family, and never through `fontWeight`.

Below 900 px use one content column with the bottom platform bar; at 900 px and
above, navigation moves into the header and Today uses two columns. The header
and every screen share one content measure (`CONTENT_MAX_WIDTH`, 1328 px) and
one gutter (`useContentGutter`); detail views read in a single column of at
most 760 px.

`Link asChild` forwards its child's `style` to the rendered anchor unchanged, so
a linked `Pressable` must receive one flat style object (no functions, no
arrays). Put pressed feedback in its render children instead.

## Accessibility and release checks

WCAG 2.2 AA is a target, not a conformance claim. Keep 44-point targets, visible
web focus, clear labels, radio semantics for appearance and language choices,
live status updates, reduced-motion support, and state that does not rely on
color alone.

Before you distribute a signed native artifact, check VoiceOver/TalkBack, large
and bold text, orientation, navigation and back behavior, and offline recovery on
target devices. Browser and local test runs do not replace those checks.
