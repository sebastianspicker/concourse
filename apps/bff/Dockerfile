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

USER node
WORKDIR /repo/apps/bff
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const req=require('node:http').get({host:'127.0.0.1',port:4000,path:'/health',timeout:2000},res=>process.exit(res.statusCode===200||res.statusCode===401?0:1));req.on('timeout',()=>{req.destroy();process.exit(1)});req.on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]
