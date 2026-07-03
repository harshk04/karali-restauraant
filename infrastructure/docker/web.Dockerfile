FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/utils/package.json packages/utils/package.json
COPY packages/hooks/package.json packages/hooks/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @karali/frontend build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./.next/static
COPY --from=builder /app/apps/frontend/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
