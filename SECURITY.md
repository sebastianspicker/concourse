# Security policy

## Supported versions

Before the first alpha tag, security fixes go to the default branch. After
publication, fixes go to the default branch and the latest `1.2.0-alpha.x`
release. Older prereleases are not supported.

## Reporting a vulnerability

Please use the private
[Security Advisory form](https://github.com/sebastianspicker/concourse-campus-kit/security/advisories/new).
Do not open a public issue, and do not attach exploit details, credentials,
private URLs, or personal data to public discussions.

## Scope and data boundary

This repository handles public campus sources only: public HTTP(S) event pages,
public iCalendar (ICS) feeds, public pack metadata, and sanitized static-demo
data. It contains no private connector code.

Keep API keys, tokens, passwords, certificates, private endpoints,
protected-system identifiers, captured user data, and signing material out of
the repository, and store secrets in private deployment storage. Protected
integrations, single sign-on (SSO), accounts, personal schedules, and
operational systems live elsewhere.

## API deployment notes

The optional bearer guard starts disabled. To turn it on for a private
deployment, set `BFF_REQUIRE_AUTH=1` and provide a long random `BFF_AUTH_TOKEN`.
Any other non-empty `BFF_REQUIRE_AUTH` value makes startup fail.

Leave `BFF_TRUST_PROXY` at `never` unless the deployment configures reviewed
proxy trust. In `never` mode, rate limiting uses the direct peer and ignores
forwarding headers.

When a reviewed proxy has to forward identity, configure `BFF_TRUSTED_PROXIES`
with exact Internet Protocol (IP) addresses or Classless Inter-Domain Routing
(CIDR) ranges. The `always` setting is unsafe except behind an isolated edge
that replaces forwarding headers.

## Coordinated disclosure

If you are unsure about the impact, use the same private advisory form and mark
the report unconfirmed. The project does not promise a response or fix deadline
for alpha reports.
