# Mobile (Campus App Kit)

This is the public Expo app for the Campus App Kit.

## Local development

Install from the repo root:

```bash
pnpm install
```

Start the app:

```bash
pnpm --filter @campus/mobile start
```

If you use a dev client:

```bash
pnpm --filter @campus/mobile dev
```

## Configuration

This app expects a BFF base URL:

- Local/dev builds: defaults to `http://localhost:4000`.
- Production builds: set `EXPO_PUBLIC_BFF_BASE_URL` (for example via EAS environment variables).

## Releases (EAS)

From `apps/mobile/`:

```bash
pnpm build:preview
pnpm build:production
```
