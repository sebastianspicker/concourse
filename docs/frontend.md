# Client conventions

apps/client is the Expo Router application for native and responsive web targets. Its routes live in apps/client/app/; product behavior and visual rules are defined in [PRODUCT.md](../PRODUCT.md) and [DESIGN.md](../DESIGN.md).

## Data and state

Public-data hooks live in apps/client/src/data/public/ and use the transport layer in apps/client/src/platform/http/. They abort superseded requests, retain usable rows during refresh, validate API responses with @concourse/contracts, and coordinate the persisted cache.

EXPO_PUBLIC_BFF_BASE_URL is required for API-backed use. If the API returns x-institution-id, it must match the client's configured institution. The UI must distinguish initial loading, current data, cached/offline data, degraded data, empty data, configuration errors, and request errors. Do not display raw server errors or present stale data as current.

CONCOURSE_STATIC_DEMO=1 selects fixture-only static-demo behavior. It is for the Pages artifact and must not contact the API or external sources.

## Design system and layout

- src/design-system/ owns shared components, tokens, theming, and state UI.
- src/shell/ owns shared application chrome and error boundaries.
- src/features/ owns route-oriented feature composition.
- src/localization/ owns supported locale and campus-time presentation.

Do not add remote fonts, a second styling system, or per-screen theme tokens. Below 900 px use one content column and scrollable top navigation; at 900 px and above use the desktop layout. Tab content is bounded to 1400 px and details to 1280 px.

## Accessibility and release checks

WCAG 2.2 AA is a target, not a conformance claim. Keep 44-point targets, visible web focus, clear labels, radio semantics for appearance/language choices, live status updates, reduced-motion support, and non-color-only state.

Before distributing a signed native artifact, validate VoiceOver/TalkBack, large and bold text, orientation, navigation/back behavior, and offline recovery on target devices. Browser and local test evidence do not replace those checks.
