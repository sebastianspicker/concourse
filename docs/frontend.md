# Frontend conventions

The Expo application implements the product scope in
[`PRODUCT.md`](../PRODUCT.md) and the token and component rules in
[`DESIGN.md`](../DESIGN.md).

## Routes and data

Expo Router owns Today, Events, Rooms, Settings, and the event, room, and
schedule detail routes under `apps/mobile/app/`.

Resource hooks call the BFF through `src/data/publicApi.ts`. The shared loader
aborts superseded requests, preserves existing rows while refreshing, and
returns loading, error, refresh, and freshness state. Persisted public data can
be used during offline or degraded operation.

The client requires `EXPO_PUBLIC_BFF_BASE_URL`. It validates BFF responses with
the schemas in `@concourse/shared`. When a response includes
`x-institution-id`, that ID must match the mobile build.

## Theme and layout

- `src/ui/designPresets.ts` owns institution preset palettes and metrics.
- `src/ui/theme.ts` owns shared typography, spacing, and semantic colors.
- `ThemeProvider` resolves system, light, dark, and high-contrast appearance.
- The selected institution pack supplies the default locale, preset, and accent.
- High-contrast mode ignores institution palette overrides.

Under 900 pixels, routes use one content column and horizontally scrollable top
navigation. At 900 pixels and above, identity and navigation share one row and
Today uses two columns. Tab routes use up to 1400 pixels and detail content uses
up to 1280 pixels.

Do not add a second styling system, remote fonts, or per-screen theme tokens.
Build routes from the shared components in `src/ui/` and `src/components/`.

## State presentation

Each public resource distinguishes:

- initial loading
- current data
- cached or offline data
- partial or degraded data
- empty data
- configuration and request errors

Keep stale or selected records visible during refresh when possible. Source
status and recovery actions must describe the resource currently on screen.
Do not display raw server errors.

## Accessibility

WCAG 2.2 AA is a target, not a conformance claim.

- Controls use at least 44 by 44 point targets.
- Search inputs have visible labels and clear actions.
- Language and appearance choices expose radio semantics.
- Status changes use live regions.
- System font scaling remains enabled.
- Web focus is visible.
- Loading placeholders do not animate.
- Interaction does not depend on hover.

## Native checks

Before distributing a signed native artifact, verify on target devices:

- VoiceOver and TalkBack
- large and bold text
- reduced motion
- portrait and landscape orientation
- offline and recovery announcements
- navigation and back behavior

Browser and native accessibility remain owner-managed release checks.
