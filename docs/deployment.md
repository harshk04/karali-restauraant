# Deployment Guide

## Local

1. Start PostgreSQL and Redis with `docker compose up -d postgres redis`
2. Install dependencies with `pnpm install`
3. Generate Prisma client with `pnpm db:generate`
4. Run the database seed with `pnpm db:seed`
5. Start the frontend and backend in separate terminals with `pnpm --dir apps/frontend dev` and `pnpm --dir apps/backend dev`

## Azure

Recommended deployment target:

- Frontend: Azure Container Apps or Azure App Service
- Backend: Azure Container Apps
- Database: Azure Database for PostgreSQL
- Cache: Azure Cache for Redis
- Storage: AWS S3 still works as requested for assets

## Build Targets

- `apps/frontend` container serves the Next.js frontend
- `apps/backend` container serves the NestJS API
