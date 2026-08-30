## Summary

<!-- What does this change do, and why? -->

## Scope

<!-- Note affected areas: client, API, public contracts, institution packs, docs, CI/tooling. -->

## Verification

<!-- List commands run and results. If skipped, explain why. -->

## Checklist

- [ ] `pnpm verify` passes locally
- [ ] No secrets or private endpoints added
- [ ] Tests added/updated (offline-capable)
- [ ] Docs updated (if workflows/env vars changed)
- [ ] Visible UI changes include responsive and accessibility checks
- [ ] Release metadata passes `pnpm release:check` (if versioning or release notes changed)
- [ ] Public contracts updated before API/client response-shape changes
- [ ] Mobile status UI reflects real runtime state, not optimistic assumptions
- [ ] Security/privacy impact considered for public template safety
