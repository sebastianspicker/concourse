## Summary

<!-- What does this change do, and why? -->

## Scope

<!-- Which areas are affected: client, API, public contracts, institution packs, docs, CI/tooling? -->

## Verification

<!-- List the commands you ran and their results. If you skipped one, say why. -->

## Checklist

- [ ] `pnpm verify` passes locally
- [ ] No secrets or private endpoints added
- [ ] Tests added or updated, and they run offline
- [ ] Docs updated if workflows or environment variables changed
- [ ] Visible UI changes include responsive and accessibility checks
- [ ] Release metadata passes `pnpm release:check` if versioning or release notes changed
- [ ] Public contracts updated before any API or client response-shape change
- [ ] Mobile status UI reflects real runtime state, not optimistic assumptions
- [ ] Security and privacy impact considered for public-template safety
