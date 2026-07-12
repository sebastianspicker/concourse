# Deploy: BFF

## Container build

Build:

```bash
docker build -f apps/bff/Dockerfile.prod -t campus-bff:local .
```

Run:

```bash
docker run --rm -p 4000:4000 \\
  -e INSTITUTION_ID=hfmt \\
  -e BFF_PORT=4000 \\
  campus-bff:local
```

## Reverse proxies

- `BFF_TRUST_PROXY` defaults to `never`, so rate limiting uses the direct socket
  address and ignores `X-Forwarded-For`/`Forwarded`.
- Set `BFF_TRUST_PROXY=auto` or `always` only when the BFF is reachable
  exclusively through a trusted reverse proxy.
- The server accepts `x-request-id` and always returns `x-request-id` in the response headers.
