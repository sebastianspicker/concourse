# Support

Concourse Campus Kit is a source candidate. Community support covers the public
connectors, shared schemas, institution packs, documented build paths, and
reproducible behavior in this repository.

## Before opening an issue

1. Check the [README](README.md) and the [runbook](docs/runbook.md).
2. Reproduce against the current default branch with Node 22.13 and pnpm 9.
3. Run the narrow relevant check, or `pnpm verify` when practical.
4. Strip credentials, private URLs, student data, internal institution names,
   signing material, and proprietary connector details from every log and image.

Use the [bug form](https://github.com/sebastianspicker/concourse-campus-kit/issues/new?template=bug_report.yml)
for a reproducible defect, the [feature form](https://github.com/sebastianspicker/concourse-campus-kit/issues/new?template=feature_request.yml)
for a public template proposal, and the [alpha feedback form](https://github.com/sebastianspicker/concourse-campus-kit/issues/new?template=alpha_feedback.yml)
for adoption feedback. Include the exact version, platform, institution pack
(or a sanitized minimal pack), expected behavior, observed behavior, and the
checks you ran.

## Out of scope

The public issue tracker cannot help with private connectors, protected campus
systems, production credentials, real SSO, signing accounts, store review, or
institution-specific infrastructure. Keep those discussions in your
organization's private repository and support channels.

## Security and conduct

Report vulnerabilities through
[GitHub Security Advisories](https://github.com/sebastianspicker/concourse-campus-kit/security/advisories/new),
not a public issue. Participation is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md).
