# Design reference

The mobile and responsive web application use one shared token and component
system. Runtime screenshots under [`docs/screenshots/`](docs/screenshots/) are
the current visual evidence. The concept files under
[`docs/mockups/concourse-quiet-chronograph/`](docs/mockups/concourse-quiet-chronograph/)
are design references, not runtime captures.

## Token ownership

| Source | Responsibility |
|---|---|
| `packages/shared/src/domain/public.ts` | Allowed preset names and institution accent validation |
| `apps/mobile/src/ui/designPresets.ts` | Preset palettes and layout metrics |
| `apps/mobile/src/ui/theme.ts` | Shared typography, spacing, and semantic colors |
| `apps/mobile/src/ui/ThemeProvider.tsx` | Appearance, preset, and institution accent resolution |

Screens should consume `useTheme()` and shared primitives. Do not duplicate
preset metrics or create a screen-specific color system.

## Institution presets

| Preset | Bundled example | Purpose |
|---|---|---|
| `wayfinding` | `example` | Default density and geometry |
| `atelier` | `hfmt` | Taller row rhythm |
| `precision` | `mockuni` | Denser row rhythm |

Omitting `app.designPreset` selects `wayfinding`. Presets can change neutral
colors, density, radii, and navigation width. They do not change route
structure, control meaning, or semantic status colors. High-contrast mode uses
its own fixed palette.

An institution accent must be a six-digit hex color, reach a 3:1 contrast ratio
against every supported preset canvas, and support either black or white text
at 4.5:1. Shared-schema validation rejects invalid values.

## Layout

- Below 900 pixels, routes use one column and the top navigation can scroll.
- At 900 pixels and above, identity and navigation share a row and Today uses
  two content columns.
- Tab routes use up to 1400 pixels. Detail content uses up to 1280 pixels.
- Layouts must be reviewed across relevant viewport widths before release.
- Layouts must remain operable at 200 percent browser zoom.

## Components

Use existing primitives before introducing a new one:

- `Screen`
- `Section`
- `SearchBar`
- `ResourceList` and `ResourceListItem`
- `ResourceDetailScreen`
- `StatusBanner`
- `EmptyState` and `ErrorState`
- `SettingsGroup` and `ChoiceRow`
- skeleton and freshness components

Today places the campus clock and current state before its schedule and event
lists. Events and Rooms provide labeled search and sortable lists. Detail
routes preserve the selected record while data refreshes. Settings use radio
semantics for appearance and language.

## Interaction and accessibility

- Shared controls define a minimum 44 by 44 point target.
- Web controls require a visible focus treatment.
- Appearance and language options expose radio semantics.
- Status changes use live regions.
- Loading placeholders are static.
- Press feedback is brief and respects reduced-motion preferences.
- State is never encoded by color alone.

Before native distribution, test VoiceOver, TalkBack, text scaling, bold text,
orientation, and offline recovery on the signed artifact.

## Screenshot set

The reviewed release evidence consists of exactly these files:

- `docs/screenshots/concourse-today-1600-light.png`
- `docs/screenshots/concourse-today-390-light.png`
- `docs/screenshots/concourse-events-1440-light.png`
- `docs/screenshots/concourse-event-detail-1440-light.png`
- `docs/screenshots/concourse-event-detail-390-light.png`
- `docs/screenshots/concourse-rooms-1440-light.png`
- `docs/screenshots/concourse-rooms-320-light.png`
- `docs/screenshots/concourse-settings-1440-light.png`
- `docs/screenshots/concourse-settings-768-high-contrast-de.png`

Review the images after regeneration. Rendering can differ by operating system.
