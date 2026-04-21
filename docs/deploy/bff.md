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

- Rate limiting derives a client key from `X-Forwarded-For`/`Forwarded` with a socket fallback.
- The server accepts `x-request-id` and always returns `x-request-id` in the response headers.
