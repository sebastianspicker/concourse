# FAQ

## Is this production-ready?

It is a public template. Production systems require private connectors, a secure auth flow,
and deployment hardening that live in a private repo.

## Why keep connectors private?

Private systems often require credentials, session handling, or fragile endpoints.
Keeping them private avoids leaking sensitive details and reduces abuse risk.

## Can we publish our institution name and campuses?

Yes, if the data is public. Avoid private endpoints, admin routes, or internal IDs.

## Where do secrets go?

Use a secret manager (GitHub Actions Secrets, 1Password, Vault). Never commit secrets.

## Do we need a BFF?

Not strictly, but it is strongly recommended to keep tokens and sessions off-device
and to normalize data for the app.

## How do we add schedules and room availability?

Implement private connectors that pull schedules and occupancy data, then expose
safe API routes in your private BFF.
