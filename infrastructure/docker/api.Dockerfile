FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @karali/backend prisma generate
RUN pnpm --filter @karali/backend build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "apps/backend/dist/main.js"]
