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

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const http=require('node:http');const req=http.get('http://127.0.0.1:4000/health',(res)=>process.exit(res.statusCode&&res.statusCode<500?0:1));req.on('error',()=>process.exit(1));req.setTimeout(4000,()=>{req.destroy();process.exit(1);});"

CMD ["node", "dist/server.js"]
