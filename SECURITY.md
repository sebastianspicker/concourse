# Security Policy

## Supported Versions

Before the first alpha tag is published, security fixes target the current
default branch. After publication, fixes target the current default branch and
the latest published `1.2.0-alpha.x` release. Older prereleases are not
supported release lines.

## Reporting a Vulnerability

Use the repository's private
[Security Advisory form](https://github.com/sebastianspicker/campus-app-kit/security/advisories/new).
Do not open a public issue for a vulnerability and do not attach exploit details,
credentials, private URLs, or personal data to a public discussion.

GitHub Security Advisories is the only repository-managed private reporting
channel for this alpha. If the form is unavailable, retain the report and retry
later, or contact a listed maintainer through a private channel that you can
independently verify. Do not move sensitive details to a public issue as a
fallback.

## Scope

This public repo is a template. It intentionally contains only public data sources and stubs.
Private integrations and operational systems are out of scope for this public
repo and must live in a private repo unless an explicitly private fork owns and
documents the integration boundary.

## No Secrets in This Repo

Do not commit API keys, tokens, passwords, certificates, or private endpoints.
Use environment variables and secret stores in private infrastructure instead.

## BFF Auth Notes

This public template serves public data without auth by default. Private forks
that enable BFF bearer auth must set both values below, unless they replace this
template guard with a reviewed private authentication layer:

- `BFF_REQUIRE_AUTH=1` (also accepts `true`, `yes`, or `on`)
- `BFF_AUTH_TOKEN=<long random secret>`

Unset, `0`, `false`, `no`, and `off` disable the guard. Any other non-empty
`BFF_REQUIRE_AUTH` value fails closed with `auth_misconfigured`.

## BFF Proxy Trust Notes

`BFF_TRUST_PROXY` defaults to `never`, so rate limiting uses the direct peer
address and ignores `X-Forwarded-For`/`Forwarded`. To accept forwarded client
identities, prefer `BFF_TRUSTED_PROXIES` with exact proxy IPs or CIDR ranges.
The BFF then walks the forwarding chain only through allowlisted hops. `auto`
is rejected. `always` is a legacy, unsafe override and is appropriate only when
the BFF is network-isolated behind an edge that replaces forwarded headers.

## Coordinated Disclosure

If classification is uncertain, use the same private advisory form and label
the report as unconfirmed. The project does not publish a response-time or fix
deadline for alpha reports.
