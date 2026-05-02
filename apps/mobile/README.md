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

- Set `EXPO_PUBLIC_BFF_BASE_URL` in development and production.
- For local development, use the BFF URL reachable from your simulator, emulator, or device.

## Releases (EAS)

From `apps/mobile/`:

```bash
pnpm build:preview
pnpm build:production
```
