FROM node:20-alpine

WORKDIR /repo
RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json turbo.json ./
COPY apps/bff/package.json apps/bff/tsconfig*.json ./apps/bff/
COPY apps/bff/src ./apps/bff/src
COPY packages/shared/package.json packages/shared/tsconfig*.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY packages/institutions/package.json packages/institutions/tsconfig*.json ./packages/institutions/
COPY packages/institutions/src ./packages/institutions/src

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @campus/shared build && \
    pnpm --filter @campus/institutions build && \
    pnpm --filter @campus/bff build

WORKDIR /repo/apps/bff
EXPOSE 4000

CMD ["node", "dist/server.js"]
