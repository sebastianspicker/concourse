# Frontend conventions

The mobile app and responsive web export implement “The Campus Desk,” the product and visual contract in [`PRODUCT.md`](../PRODUCT.md) and [`DESIGN.md`](../DESIGN.md).

## Architecture

- Expo Router owns Today, Events, Rooms, Settings, and public detail routes.
- `src/ui/theme.ts` is the only runtime token source. Do not add Tailwind, NativeWind, decorative theme layers, custom fonts, or per-screen colors.
- Institution identity comes from `INSTITUTION_ID` at build time and the selected public pack. Preview and production builds must set it explicitly.
- Data loaders return the payload with `source`, `updatedAt`, and `cacheAge`. Screens show saved/degraded status for the resource being rendered; connection state remains global.
- The BFF may omit `X-Institution-Id` for compatibility. When present, it must match the app build or the client renders a configuration error.
- Authentication and private schedules are downstream extension seams. Public routes must not present demo sign-in or private-connector copy.

## Accessibility

Target WCAG 2.2 AA on web plus VoiceOver and TalkBack. Interactive targets are at least 44×44 points. Search has a visible label and clear action; appearance and language choices use radio semantics; status changes use live regions. System font scaling remains enabled. High contrast is a fixed black/white/cyan scheme, while light and dark remain independently accessible. Loading placeholders do not animate.

Before release, manually verify keyboard focus, 200% zoom and text scaling, bold text, reduced motion, VoiceOver, TalkBack, portrait/landscape, and offline/recovery announcements. These checks cannot be inferred from unit tests.

## Responsive policy

- Under 900px: one column and bottom tabs.
- At 900px and above: left navigation and a two-column Today layout.
- Lists/details cap at 760px, Settings at 640px, and Today at 1040px.
- Supported validation widths are 320, 390, 768, 1024, and 1440 pixels.

The web support target is the current and previous major Chrome, Edge, Firefox, and Safari. Do not hide controls at browser zoom or depend on hover.

## Testing

Run `pnpm test:web` for the deterministic Expo web export, keyboard/search/settings journey, 200% zoom check, responsive widths, Material Icons font check, and serious/critical axe rules. It writes the current release screenshots under `docs/screenshots/`. The full `pnpm verify` gate includes this browser suite alongside typecheck, lint, unit tests, build, and BFF E2E.

Detox selectors are `tab-today`, `tab-events`, `tab-rooms`, `tab-settings`, `events-search`, `rooms-search`, and the corresponding `*-screen`/`*-list` identifiers. E2E tests must fail when a required selector or assertion is missing; never catch a failed requirement as a passing test.

Native development builds, the browser matrix, screen-reader checks, and the manual release matrix remain explicit release gates even when local JavaScript checks pass.
