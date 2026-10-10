# Design reference

`apps/client` uses a single design system across its Expo native and responsive
web targets. Its direction, "Stage", is the confident register of a contemporary
arts university: black on white, a heavy uppercase display voice for the one
thing that matters, light titles, flat blocks of color, square cards, and round
arrows. Today still answers what is on now, what is next, where, and whether the
data is current.

## Ownership

| Source | Responsibility |
|---|---|
| `packages/institutions/src/branding.ts` | Supported presets and accessible institution accents |
| `apps/client/src/design-system/designPresets.ts` | Preset palettes and layout metrics |
| `apps/client/src/design-system/theme.ts` | Typography, spacing, and semantic colors |
| `apps/client/src/design-system/ThemeProvider.tsx` | Appearance, preset, and accent resolution |
| `apps/client/src/design-system/fonts.ts`, `fontAssets.ts`, `assets/fonts/` | Bundled typefaces and their OFL licenses |
| `apps/client/src/design-system/StatusLamp.tsx` | Freshness lamps and status tags |

Screens build on the shared design-system components and `useTheme()`. Please do
not add a second token set or a screen-specific color scheme.

## Type, color, and status

- Two voices. Outfit (Black and ExtraBold, uppercase) sets the current entry,
  the campus clock, record titles, the wordmark, and calls to action. Concourse
  Text (a renamed Source Sans 3 subset) sets page and section titles in Light
  and everything else in Regular and SemiBold. Each `typography` role carries
  its font family, so never set `fontWeight` on text.
- One theme per render: black on white with a light grey band, white on near
  black in dark, and the fixed high-contrast palette.
- Flat color, no gradients: "now" is an orange block (`signal`, black text);
  the institution color (`brand`) fills the Next card and other blocks, with
  `brandText` on top; `accent` is a readable tint of it for links and focus.
  Primary buttons are solid black. Status colors appear only on status lamps
  and problems.
- Status uses a square lamp whose shape carries the meaning: filled for
  current, hollow for saved or checking, half for limited, and crossed for
  offline or unavailable. A label always accompanies it. Row states are chips:
  an orange "Now", an outlined "Next", and a muted "Ended".
- Square corners everywhere; the only round shapes are the arrow buttons that
  mark a card as a way in, the back control, and radio buttons. Lists use
  hairlines; event cards use a 1 pt border. No shadows. There is no
  photography: packs carry no images, and stock pictures would misrepresent a
  real campus.

## Presets and layout

The supported presets are `wayfinding`, `atelier`, and `precision`, and a pack
without one falls back to `wayfinding`. A preset may change neutral colors,
density, radii, and navigation width, but never route meaning, control
semantics, or status colors. High-contrast mode uses its own fixed palette.

An institution accent is a six-digit hex value checked against every supported
canvas. It has to keep the required contrast against both black and white text.

- Below 900 px, routes use one column, and navigation is a bottom platform bar
  with 56-point targets.
- At 900 px and above, identity, navigation, and the status column share the
  header row, and Today uses two content columns.
- The header and every route share one 1328 px content measure and the same
  gutters; details read in a single column of at most 760 px.
- Check the relevant widths and 200% browser zoom before release.

## Components and accessibility

Build screens from the shared components in `apps/client/src/design-system/` and
the app chrome in `apps/client/src/shell/`. Today leads with the campus clock and
current state, Events and Rooms offer labeled search and sorting, and details
keep the selected record visible while data refreshes.

- Controls have targets of at least 44 by 44 points.
- Web focus is visible, and choices expose radio semantics.
- Status changes use live regions, and state never relies on color alone.
- Loading placeholders are static. Motion is press feedback and one gentle
  entrance on first load (opacity and an 8 px rise), and reduced motion removes
  both. Nothing blinks.
- Before native distribution, test VoiceOver, TalkBack, text scaling, bold text,
  orientation, and offline recovery on a signed artifact.

Rendering differs across platforms and operating systems. Review visible changes
on the sizes and devices you support rather than treating one browser render as
universal evidence.
