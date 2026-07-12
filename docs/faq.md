# FAQ

## Is this production-ready?

The public-data app can be deployed after configuring an institution pack, validating its public sources, and completing the release matrix in `docs/frontend.md`. Authentication and private connectors are not required for the public product. Deployments that add private data need a separately reviewed private fork and authentication architecture.

## Why keep connectors private?

Private systems often require credentials, session handling, or fragile endpoints.
Keeping them private avoids leaking sensitive details and reduces abuse risk.

## Can we publish our institution name and campuses?

Yes, if the data is public. Avoid private endpoints, admin routes, or internal IDs.

## Where do secrets go?

Use a secret manager (GitHub Actions Secrets, 1Password, Vault). Never commit secrets.

## Where do internal planning or audit docs go?

Keep internal planning, audit, ledger, status, and deprecated-doc packets out of
the public docs tree. Use a private fork or the ignored local `archive/` lane.

## Do we need a BFF?

Not strictly. It is recommended when an institution needs normalized upstream data,
consistent caching and errors, or a server-controlled public-source boundary.

## How do we add schedules and room availability?

Configure public schedules through `publicSources.schedules` in the institution pack.
Private room occupancy or personalized schedules are outside this public starter and
belong in a reviewed private fork.
