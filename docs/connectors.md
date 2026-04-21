# Connectors

Connectors provide data to the BFF. The BFF loads an institution pack, then calls the appropriate connector(s) per route.

```mermaid
flowchart LR
  subgraph Routes["BFF routes"]
    E[/events]
    T[/today]
    S[/schedule]
  end
  subgraph Public["Public connectors"]
    Events[fetchPublicEvents]
    Schedule[fetchPublicSchedule]
  end
  subgraph Stubs["Private stubs"]
    Bookings[fetchBookings]
  end
  E --> Events
  T --> Events
  S --> Schedule
  Events --> Web[Websites / HTML]
  Schedule --> ICS[ICS feeds]
  Bookings -.->|empty []| -
```

## Public connectors

- Use only public sources (websites, RSS, open APIs).
- Safe to publish and run locally.

## Private stubs

The public repo ships interfaces and stubs only. Stubs return empty arrays (e.g. `fetchBookings()` → `[]`) with no signal that the connector is unimplemented; for private forks, consider tagged responses (e.g. `{ stub: true, data: [] }`) or clear documentation. Private repos implement the real connectors and wire them in.

## Pattern

- `apps/bff/src/connectors/public/` for public sources.
- `apps/bff/src/connectors/private-stubs/` for interfaces and mock outputs.

## Testing

Public connectors should be tested with fixtures and deterministic dates.
Private connectors should be tested in the private repo.
