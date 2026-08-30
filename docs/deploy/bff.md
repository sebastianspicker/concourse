# Deploy: API

apps/api is the Node.js BFF for public campus data. Its production Dockerfile builds the contracts, institution packs, and API, then runs as a non-root user under dumb-init.

Build a local candidate from the repository root:

~~~bash
docker build -f apps/api/Dockerfile.prod \
  --build-arg APP_VERSION=local \
  -t concourse-api:local .
~~~

Run it with a public institution pack:

~~~bash
docker run --rm -p 4000:4000 \
  -e INSTITUTION_ID=hfmt \
  -e BFF_PORT=4000 \
  concourse-api:local
~~~

Request GET /health before publication. To test a custom port, publish and set the same internal port, for example -p 4100:4100 -e BFF_PORT=4100.

## Production controls

- Supply INSTITUTION_ID and production CORS_ORIGINS through deployment configuration. Keep auth tokens in secret storage, never in pack data or image layers.
- The health check can send BFF_AUTH_TOKEN when the optional bearer guard is enabled. /health does not prove external source reachability.
- Leave BFF_TRUST_PROXY=never unless the network boundary is reviewed. Prefer exact BFF_TRUSTED_PROXIES IP/CIDR values; always is unsafe for an exposed API unless a trusted edge replaces forwarding headers.
- Confirm source URLs are public and reachable from the deployed API host. Do not deploy credentials or protected-source configuration with this repository.
