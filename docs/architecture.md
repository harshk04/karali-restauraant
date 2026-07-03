# Architecture

```mermaid
flowchart LR
  Customer[Customer Web App] --> Web[Next.js 15]
  Staff[Staff PWA] --> Web
  Admin[Admin Portal] --> Web
  Web --> API[NestJS API]
  API --> Prisma[Prisma ORM]
  Prisma --> Postgres[(PostgreSQL)]
  API --> Redis[(Redis)]
  API --> S3[(AWS S3)]
  API --> SES[(AWS SES)]
  API --> Razorpay[Razorpay]
  API --> WhatsApp[WhatsApp API]
  API --> SMS[SMS API]
```

## Notes

- Web and staff/admin experiences share the same design system and components.
- The API is organized by domain modules.
- Prisma is the system of record for bookings, tables, slots, check-ins, payments, notifications, and audit logs.
