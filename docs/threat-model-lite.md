# Threat Model Lite

This is a lightweight checklist for what must not be committed to the public repo.

## Do Not Commit

- API keys, tokens, passwords, certificates.
- Private endpoints, internal hostnames, admin routes.
- Logs or fixtures with real user data.
- Scraping logic for private portals.
- Internal planning, audit, ledger, status, and deprecated-doc packets.

## Safe To Commit

- Public campus data and labels.
- Public website sources.
- UI and domain models.

## Guardrails

- Use `.env` files locally; never commit them.
- Keep retired internal docs in a private fork or the ignored local `archive/`
  lane.
- Rotate secrets if anything leaks.
- Keep the public repo a safe template.

## If unsure

Assume it is private. Move it to a private repo and use a stub in the public repo.
