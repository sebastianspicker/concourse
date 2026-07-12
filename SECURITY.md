# Security Policy

## Reporting a Vulnerability

Use GitHub's private [Security Advisories](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/creating-a-repository-security-advisory) to report vulnerabilities privately. Do not open public issues for security reports.

## Scope

This public repo is a template. It intentionally contains only public data sources and stubs.
Private integrations and operational systems are out of scope for this public
repo and must live in a private repo unless an explicitly private fork owns and
documents the integration boundary.

## No Secrets in This Repo

Do not commit API keys, tokens, passwords, certificates, or private endpoints.
Use environment variables and secret stores in private infrastructure instead.

Do not commit internal planning, audit, ledger, status, or deprecated-doc
packets. Keep those artifacts in a private fork or the ignored local `archive/`
lane.

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
address and ignores `X-Forwarded-For`/`Forwarded`. Set `auto` or `always` only
when the BFF is reachable exclusively through a trusted reverse proxy. The `never` mode is recommended for uncertain topologies unless deployment owners have documented and reviewed a trusted proxy boundary, in which case they may select `auto` or `always`.

## Coordinated Disclosure

If you are unsure whether something is a vulnerability, contact us privately.
We will work with you to validate and resolve issues responsibly.
