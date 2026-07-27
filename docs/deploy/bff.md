# Deploy: BFF

Build both BFF images from the repository root. The root `.dockerignore` keeps
local dependencies, build/test output, internal tool state, environment files,
and signing material out of the Docker context.

## Container build

The production image uses the repository's Node 22.13 baseline, runs as a
non-root user under `dumb-init`, and reads its health-probe port from `BFF_PORT`.
When bearer auth is enabled, the probe sends `BFF_AUTH_TOKEN`; it does not expose
the token in the image definition.

Build a local candidate with an explicit health version:

```bash
docker build -f apps/bff/Dockerfile.prod \
  --build-arg APP_VERSION=local \
  -t campus-bff:local .
```

Run on the default port:

```bash
docker run --rm -p 4000:4000 \
  -e INSTITUTION_ID=hfmt \
  -e BFF_PORT=4000 \
  campus-bff:local
```

To prove custom-port wiring, publish and request the same internal port, for
example `-p 4100:4100 -e BFF_PORT=4100`. `GET /health` returns the embedded
`APP_VERSION` and must answer before an image is published.

## Reverse proxies

- `BFF_TRUST_PROXY` defaults to `never`, so rate limiting uses the direct socket
  address and ignores `X-Forwarded-For`/`Forwarded`.
- Configure `BFF_TRUSTED_PROXIES` with the exact proxy IPs or CIDRs (for example,
  `127.0.0.1,10.24.0.0/16`) to enable forwarded client identities. The BFF honors
  headers only from those immediate peers and walks multi-hop chains right-to-left.
  Set `BFF_TRUST_PROXY=never` to override the allowlist and use socket addresses only.
- `BFF_TRUST_PROXY=auto` is rejected. `always` is an unsafe legacy override; use
  it only if the BFF is network-isolated behind an edge that replaces forwarded headers.
- The server accepts `x-request-id` and always returns `x-request-id` in the response headers.
