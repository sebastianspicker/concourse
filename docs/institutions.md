# Institution packs

Institution packs define public identity, campuses, rooms, data sources,
timezone, locale, accent, and layout preset. They live in
`packages/institutions/src/packs/` and are registered in
`packages/institutions/src/packs.ts`.

Bundled packs:

| ID | Use |
|---|---|
| `example` | Generic public example |
| `hfmt` | Public HfMT configuration |
| `mockuni` | Deterministic test configuration |

## Schema

The pack contract is `InstitutionPackSchema` in
`packages/shared/src/domain/public.ts`. Major fields are:

- `id`, `name`, and `type`
- `campuses`
- optional `publicRooms`
- optional `publicSources.events`
- optional `publicSources.schedules`
- optional IANA `timezone`
- optional `app.displayName`, `app.defaultLocale`, `app.designPreset`, and
  `app.accent`

`designPreset` accepts `wayfinding`, `atelier`, or `precision`. The default is
`wayfinding`. Accent validation is described in [Design reference](../DESIGN.md).

## Adding a pack

1. Copy `packages/institutions/src/packs/example.public.ts`.
2. Use a unique ID and only public, non-sensitive data.
3. Register the pack in `packages/institutions/src/packs.ts`.
4. Set the same `INSTITUTION_ID` for the BFF and mobile application.
5. Exercise Today, Events, Rooms, Settings, and available detail routes.
6. Run `pnpm --filter @concourse/institutions test` and `pnpm verify`.

Missing source configuration has route-level consequences:

- no event sources: `/events` returns `404 not_found`
- no schedule sources: `/schedule` returns `404 not_found`
- no rooms: `/rooms` returns `404 not_found`
- no event sources and no rooms: `/today` returns `404 not_found`

## Data boundary

Packs may contain public campus labels, addresses, rooms, and public source
URLs. Do not add credentials, private endpoints, internal identifiers, access
instructions, or personal data. Secrets belong in deployment secret storage,
not in a pack.
