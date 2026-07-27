# Quiet Chronograph

Design concept for the current Today layout: campus clock, current and next
items, freshness state, and open lists. This directory is a reference deck, not
runtime evidence.

## Open

| File | Role |
|---|---|
| [`index.html`](./index.html) | Interactive desktop and mobile Today concept |
| [`styles.css`](./styles.css) | Concept tokens and layout |
| [`render-desktop.png`](./render-desktop.png) | Desktop frame render |
| [`render-full.png`](./render-full.png) | Full-deck render |

Open `index.html` in a browser. No build step.

## Relation to runtime evidence

Product and design contracts are in [`PRODUCT.md`](../../../PRODUCT.md) and
[`DESIGN.md`](../../../DESIGN.md). Use the captures under `docs/screenshots/`
from `pnpm test:web` as runtime evidence.

## Reference elements

- Cool canvas `#EEF1F6`, ink `#0B1424`, accent `#3B5FCF`, signal `#E8A800`
- Functional clock with signal-colored colon
- Now chamber = signal/amber; Next chamber = inverse/midnight
- Quiet live freshness chip; explicit source status when degraded
- Current-time rule + schedule time spine for the next item
- Open ledgers, system fonts, square geometry; no glass, cards, or heroes
- Institution primary, Concourse secondary
