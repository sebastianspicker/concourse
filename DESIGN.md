# The Campus Desk Design System

## Direction

Campus App Kit uses a restrained, tonal-flat product interface. Content and current data state lead; institution identity appears through a single validated accent and product name. System typography, compact rows, dividers, and familiar controls keep the interface native and legible.

## Color

| Role | Light | Dark |
|---|---|---|
| Background | `#F5F7F8` | `#101417` |
| Surface | `#FFFFFF` | `#171D21` |
| Text | `#17202A` | `#F5F7F8` |
| Muted | `#5C6873` | `#AEB8C0` |
| Divider | `#D7DEE3` | `#3A444B` |
| Control border | `#7A8791` | `#87949D` |
| Default accent | `#176B87` | `#176B87` |
| On accent | `#FFFFFF` | `#FFFFFF` |

Brand accents must meet 3:1 against both standard canvases and 4.5:1 against their derived black or white foreground. Error, warning, success, and information use dedicated foreground/surface pairs; brand color never communicates error state. High contrast uses fixed black/white surfaces and cyan `#00D7FF` without institution overrides.

## Typography

Use the platform system font with scaling enabled. Screen titles are 24/30, section titles 18/24, body 16/24, labels and metadata 14/20, and supporting text 12/16. Use weight and spacing for hierarchy; do not use negative tracking, display fonts, or uppercase section eyebrows.

## Spacing and Shape

Use the 4, 8, 12, 16, 24, and 32 spacing scale. Radii are 4, 8, and 12 only. Controls have a minimum 44×44-point target. Surfaces are separated by tone and dividers. Shadows are reserved for temporary overlays.

## Layout

Below 900px, use bottom tabs and a one-column layout. At 900px and above, use an accessible left navigation rail; Today may use two columns. Lists and details cap at 760px, Settings at 640px, and Today at 1040px. Layouts must remain usable from 320px through 1440px and at 200% zoom without horizontal clipping.

## Components

Standard shared primitives are `Screen`/`AppFrame`, `SectionHeader`, `SearchField`, `ResourceList`/`ResourceRow`, `StatusBanner`, `EmptyState`, `ErrorState`, `DetailLayout`, and `SettingsGroup`/`ChoiceRow`. Workflow composition stays local. Lists use virtualized flat rows rather than card grids. Loading skeletons are static and safe under reduced motion.

## Interaction and Motion

Use native navigation and visible back controls. Preserve tab, search, and sort state when opening details. Motion communicates state only and lasts no more than 150ms; there are no page, card, or row entrance sequences. Every interactive component has visible focus and accessible role, name, value/state, disabled, loading, and error behavior where applicable.

## Content

Use concise, localized English/German copy. State what happened, its effect, and the recovery action. Show resource-specific freshness and cached age. Never expose stack traces, raw endpoint errors, private connector language, or demo-authentication claims.
