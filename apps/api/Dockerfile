# Development BFF image that compiles the required workspace packages in one container.
FROM node:22.13.0-alpine

WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json turbo.json ./
COPY LICENSE ./LICENSE
COPY apps/api/package.json apps/api/tsconfig*.json ./apps/api/
COPY apps/api/src ./apps/api/src
COPY packages/contracts/package.json packages/contracts/tsconfig*.json ./packages/contracts/
COPY packages/contracts/src ./packages/contracts/src
COPY packages/institutions/package.json packages/institutions/tsconfig*.json ./packages/institutions/
COPY packages/institutions/src ./packages/institutions/src

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @concourse/contracts build && \
    pnpm --filter @concourse/institutions build && \
    pnpm --filter @concourse/api build

WORKDIR /repo/apps/api
ENV BFF_PORT=4000
EXPOSE 4000

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const http=require('node:http');const headers=process.env.BFF_AUTH_TOKEN?{authorization:'Bearer '+process.env.BFF_AUTH_TOKEN}:undefined;const req=http.get({host:'127.0.0.1',port:process.env.BFF_PORT||'4000',path:'/health',headers},res=>process.exit(res.statusCode>=200&&res.statusCode<300?0:1));req.on('error',()=>process.exit(1));req.setTimeout(4000,()=>{req.destroy();process.exit(1);});"

CMD ["node", "dist/server.js"]
