# Security policy

## Supported versions

Before the first alpha tag, security fixes target the default branch. After publication, fixes target the default branch and the latest 1.2.0-alpha.x release. Older prereleases are not supported.

## Reporting a vulnerability

Use the repository's private [Security Advisory form](https://github.com/sebastianspicker/concourse/security/advisories/new). Do not open a public issue or attach exploit details, credentials, private URLs, or personal data to public discussions.

## Scope and data boundary

This public repository handles public campus sources only: public HTTP(S) event pages, public iCalendar (ICS) feeds, public pack metadata, and sanitized static-demo data. It contains no private connector implementations or stubs.

Do not commit API keys, tokens, passwords, certificates, private endpoints, protected-system identifiers, captured user data, or signing material. Keep secrets in private deployment storage. Protected integrations, single sign-on (SSO), accounts, personalized schedules, and operational systems are outside this repository.

## API deployment notes

The optional bearer guard starts disabled. To enable it for a private deployment, set BFF_REQUIRE_AUTH=1 and provide a long random BFF_AUTH_TOKEN. Any other non-empty BFF_REQUIRE_AUTH value causes startup to fail.

BFF_TRUST_PROXY uses never unless the deployment configures reviewed proxy trust. In the never mode, rate limiting uses the direct peer and ignores forwarding headers.

When a reviewed proxy must forward identity, configure BFF_TRUSTED_PROXIES. Use exact Internet Protocol (IP) addresses or Classless Inter-Domain Routing (CIDR) ranges.

The always setting is unsafe except behind an isolated edge that replaces forwarding headers.

## Coordinated disclosure

If impact is uncertain, use the same private advisory form and label the report unconfirmed. The project does not publish a response-time or fix deadline for alpha reports.
