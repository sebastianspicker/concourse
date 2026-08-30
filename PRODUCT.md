# Product scope

Concourse presents public campus information to students and visitors. The
current application covers:

- campus-local events
- public room directories
- public ICS schedule entries
- a Today view combining same-day events and rooms
- event, room, and schedule details
- language and appearance preferences

The application reports whether displayed data is current, cached, degraded,
offline, empty, or unavailable. It keeps the institution identity visible and
uses the BFF as the only campus-data API.

## Users

Students and visitors use the application to check public information. An
institution maintainer configures the institution pack, public sources, BFF,
mobile identifiers, and deployment.

## Excluded scope

The repository does not implement protected campus access, personalized
schedules, room occupancy, user accounts, SSO, signing, store submission, or
hosted infrastructure. Private integrations require a separate reviewed
implementation.

## Product rules

1. Show source freshness and failure state without hiding stale or partial data.
2. Use the same public response schema in the BFF and client.
3. Keep institution customization within the validated pack contract.
4. Preserve normal platform navigation, focus, text scaling, and control semantics.
5. Do not expose internal service errors or private integration details to users.

WCAG 2.2 AA is a design target, not a conformance claim. Keyboard navigation,
browser zoom, native screen readers, text scaling, orientation, and signed
artifacts require validation on the relevant targets.
