# Institution packs

Institution packs hold public identity, campuses, rooms, source URLs, timezone, and client presentation defaults. They live in packages/institutions/src/packs/ and are registered in packages/institutions/src/registry.ts.

| ID | Use |
|---|---|
| example | Fictional static-demo and public example pack |
| hfmt | Public HfMT configuration |
| mockuni | Deterministic test configuration |

## Contract

InstitutionPackSchema in packages/institutions/src/schema.ts validates:

- id, name, type, and campuses
- optional publicRooms
- optional publicSources.events and publicSources.schedules
- optional IANA timezone
- optional app.displayName, app.defaultLocale, app.designPreset, and accessible app.accent

The contract imports room DTOs from @concourse/contracts. Supported presets are wayfinding, atelier, and precision; absent presets resolve to wayfinding in the client. See [the design reference](../DESIGN.md) for accent and presentation rules.

## Adding a pack

1. Copy packages/institutions/src/packs/example.public.ts.
2. Use a unique ID and only public, non-sensitive data.
3. Register it in packages/institutions/src/registry.ts.
4. Set the same INSTITUTION_ID for API and client builds.
5. Exercise available Today, Events, Rooms, Schedule, Settings, and detail routes.
6. Run pnpm --filter @concourse/institutions test and pnpm verify.

No events config makes /events unavailable; no schedules makes /schedule unavailable; no rooms makes /rooms unavailable; Today requires at least event sources or rooms. Packs must not contain credentials, private endpoints, internal identifiers, access instructions, or personal data.
