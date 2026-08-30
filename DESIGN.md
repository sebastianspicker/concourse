# Design reference

apps/client uses one design system for its Expo native and responsive web targets.

## Ownership

| Source | Responsibility |
|---|---|
| packages/institutions/src/branding.ts | Supported presets and accessible institution accents |
| apps/client/src/design-system/designPresets.ts | Preset palettes and layout metrics |
| apps/client/src/design-system/theme.ts | Typography, spacing, and semantic colors |
| apps/client/src/design-system/ThemeProvider.tsx | Appearance, preset, and accent resolution |

Screens use the shared design-system components and useTheme(). Do not create a competing token set or screen-specific color system.

## Presets and layout

wayfinding, atelier, and precision are the supported presets. A missing pack preset resolves to wayfinding. Presets may affect neutral colors, density, radii, and navigation width, but not route meaning, control semantics, or status colors. High-contrast mode uses its own fixed palette.

An institution accent is a six-digit hex value validated against all supported canvases. It must provide the required contrast with black or white text.

- Below 900 px, routes use one column and the top navigation can scroll.
- At 900 px and above, identity and navigation share a row and Today uses two content columns.
- Tab routes use up to 1400 px; details use up to 1280 px.
- Review relevant widths and 200% browser zoom before release.

## Components and accessibility

Build screens from the shared components in apps/client/src/design-system/ and app chrome in apps/client/src/shell/. Today prioritizes the campus clock and current state; Events and Rooms provide labeled search and sorting; details retain the selected record while data refreshes.

- Controls have at least 44 by 44 point targets.
- Web focus is visible and choices expose radio semantics.
- Status changes use live regions; state is never color-only.
- Loading placeholders are static and motion respects user preferences.
- Test VoiceOver, TalkBack, text scaling, bold text, orientation, and offline recovery on a signed artifact before native distribution.

Rendering differs across platforms and operating systems. Review visible changes on the supported target sizes and devices instead of treating one browser render as universal evidence.
