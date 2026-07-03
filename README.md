# Karali Restaurant Platform

Production-grade monorepo for the Karali Restaurant Digital Seat Booking Portal.

## Stack

- Next.js 15 App Router
- NestJS
- PostgreSQL + Prisma
- Redis + BullMQ
- Tailwind CSS + shadcn/ui
- React Query, Zustand, Framer Motion, React Hook Form, Zod, Axios

## Layout

- `apps/frontend` - customer, staff, and admin frontend
- `apps/backend` - NestJS API
- `packages/ui` - shared UI primitives
- `packages/types` - shared domain types and DTO helpers
- `packages/utils` - utility helpers
- `packages/hooks` - shared React hooks
- `packages/config` - shared runtime config
- `prisma` - schema and seed data
- `infrastructure` - Docker, nginx, scripts
- `docs` - architecture and deployment notes

## Start

1. Install dependencies with `pnpm install`
2. Copy `apps/frontend/.env.local.example` to `apps/frontend/.env.local`
3. Copy `apps/backend/.env.example` to `apps/backend/.env`
4. Run `pnpm dev`

## Notes

- The Stitch HTML export is treated as the visual reference only.
- The new implementation uses React/TypeScript components and real application routes.
- Booking, QR, staff, and admin flows are scaffolded to production-ready patterns and can be wired to live services.
