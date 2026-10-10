# Product scope

Concourse shows public campus information to students and visitors. Today's
application covers:

- campus-local events
- public room directories
- public ICS schedule entries
- a Today view that combines same-day events and rooms
- event, room, and schedule details
- language and appearance preferences

Every screen says whether the data is current, cached, degraded, offline, empty,
or unavailable. The institution's identity stays visible, and the BFF is the
only source of campus data.

## Who it is for

Students and visitors use the app to check public information. An institution
maintainer sets up the institution pack, public sources, BFF, mobile
identifiers, and deployment. Neither role signs in: the app is built around
public data only.

## What is out of scope

The repository does not cover protected campus access, personal schedules, room
occupancy, user accounts, SSO, signing, store submission, or hosted
infrastructure. Private integrations need a separate, reviewed implementation.

## Product rules

1. Show source freshness and failure state without hiding stale or partial data.
2. Use the same public response schema in the BFF and client.
3. Keep institution customization inside the validated pack contract.
4. Preserve normal platform navigation, focus, text scaling, and control
   semantics.
5. Never expose internal service errors or private integration details.

WCAG 2.2 AA is a design target, not a conformance claim. Keyboard navigation,
browser zoom, native screen readers, text scaling, orientation, and signed
artifacts still need validation on the targets you ship to.
