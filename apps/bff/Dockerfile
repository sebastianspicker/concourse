# Development BFF image that compiles the required workspace packages in one container.
FROM node:22.13.0-alpine

WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json turbo.json ./
COPY LICENSE ./LICENSE
COPY apps/bff/package.json apps/bff/tsconfig*.json ./apps/bff/
COPY apps/bff/src ./apps/bff/src
COPY packages/shared/package.json packages/shared/tsconfig*.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY packages/institutions/package.json packages/institutions/tsconfig*.json ./packages/institutions/
COPY packages/institutions/src ./packages/institutions/src

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @concourse/shared build && \
    pnpm --filter @concourse/institutions build && \
    pnpm --filter @concourse/bff build

WORKDIR /repo/apps/bff
ENV BFF_PORT=4000
EXPOSE 4000

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const http=require('node:http');const headers=process.env.BFF_AUTH_TOKEN?{authorization:'Bearer '+process.env.BFF_AUTH_TOKEN}:undefined;const req=http.get({host:'127.0.0.1',port:process.env.BFF_PORT||'4000',path:'/health',headers},res=>process.exit(res.statusCode>=200&&res.statusCode<300?0:1));req.on('error',()=>process.exit(1));req.setTimeout(4000,()=>{req.destroy();process.exit(1);});"

CMD ["node", "dist/server.js"]
