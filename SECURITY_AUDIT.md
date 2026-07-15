# Karali Restaurant Platform Security Audit

## Scope
- Backend: NestJS API, auth, booking, QR, payments, staff/admin access, startup/runtime config
- Frontend: Next.js route protection, session handling, booking confirmation, scanner flows, global UX resilience
- Database layer: Mongoose schemas, indexes, slot reservation integrity

## Issues Fixed

### Critical

#### 1. Placeholder authentication and fake token issuance
- Severity: Critical
- Files changed:
  - `apps/backend/src/admin/admin.controller.ts`
  - `apps/backend/src/admin/admin.guard.ts`
  - `apps/backend/src/admin/admin.module.ts`
  - `apps/backend/src/admin/admin.service.ts`
  - `apps/backend/src/staff/staff.controller.ts`
  - `apps/backend/src/staff/staff.guard.ts`
  - `apps/backend/src/staff/staff.module.ts`
  - `apps/backend/src/staff/staff.service.ts`
  - `apps/backend/src/common/auth/*`
  - `apps/backend/src/common/guards/auth-rate-limit.guard.ts`
- Fix implemented:
  - Replaced weak session handling with signed short-lived access cookies and refresh cookies.
  - Added role-aware JWT verification with issuer/audience/type checks.
  - Added refresh endpoints for admin and staff.
  - Added rate limiting for login/refresh routes.
  - Switched admin auth away from hardcoded credentials toward environment-driven credentials, with bcrypt hash support for `ADMIN_PASSWORD_HASH`.

#### 2. Public booking and QR exposure via guessable booking IDs
- Severity: Critical
- Files changed:
  - `apps/backend/src/bookings/bookings.controller.ts`
  - `apps/backend/src/bookings/bookings.service.ts`
  - `apps/backend/src/qr/qr.controller.ts`
  - `apps/backend/src/qr/qr.service.ts`
  - `apps/backend/src/database/schemas/booking.schema.ts`
  - `apps/frontend/features/booking/booking-flow.tsx`
  - `apps/frontend/app/booking/confirmed/page.tsx`
- Fix implemented:
  - Removed open-ended public booking listing.
  - Added per-booking confirmation `accessKey` validation for public booking/QR retrieval.
  - Stored only hashed access keys in the database.
  - Stopped generating fallback fake QR responses for unknown bookings.

#### 3. QR forgery by booking ID only
- Severity: Critical
- Files changed:
  - `apps/backend/src/bookings/bookings.service.ts`
  - `apps/backend/src/staff/staff.controller.ts`
  - `apps/backend/src/staff/staff.service.ts`
  - `apps/backend/src/admin/admin.controller.ts`
  - `apps/backend/src/admin/admin.service.ts`
  - `apps/frontend/app/staff/scanner/page.tsx`
  - `apps/frontend/app/admin/scanner/page.tsx`
- Fix implemented:
  - Added per-booking QR tokens stored as hashes.
  - Embedded secure `qrToken` values inside generated QR payloads.
  - Updated admin and staff scanner flows to validate both `bookingId` and `qrToken`.
  - Enforced QR expiry and invalidated reused/cancelled/already-checked-in bookings.

### High

#### 4. Overbooking race conditions and stale pending reservations
- Severity: High
- Files changed:
  - `apps/backend/src/bookings/bookings.module.ts`
  - `apps/backend/src/bookings/bookings.service.ts`
  - `apps/backend/src/database/schemas/slot-occupancy.schema.ts`
  - `apps/backend/src/app.module.ts`
- Fix implemented:
  - Added atomic slot occupancy tracking.
  - Reserved capacity before booking creation and released it on failed/cancelled flows.
  - Added scheduled cleanup for stale pending bookings so abandoned payment attempts do not permanently consume capacity.

#### 5. Broken access control in middleware and frontend session storage
- Severity: High
- Files changed:
  - `apps/frontend/middleware.ts`
  - `apps/frontend/lib/http-client.ts`
  - `apps/frontend/lib/api.ts`
  - `apps/frontend/lib/staff-api.ts`
  - `apps/frontend/features/admin/admin-login.tsx`
  - `apps/frontend/features/admin/admin-shell.tsx`
  - `apps/frontend/features/staff/staff-shell.tsx`
- Fix implemented:
  - Removed localStorage-based admin bearer token storage.
  - Stopped trusting non-authenticating hint cookies for route access.
  - Added secure cookie-based refresh handling in the frontend HTTP clients.

#### 6. Inconsistent error handling and internal error leakage risk
- Severity: High
- Files changed:
  - `apps/backend/src/main.ts`
  - `apps/backend/src/common/http/api-response.interceptor.ts`
  - `apps/backend/src/common/http/global-exception.filter.ts`
  - `apps/backend/src/common/http/request-logging.interceptor.ts`
  - `apps/frontend/app/error.tsx`
  - `apps/frontend/app/loading.tsx`
  - `apps/frontend/providers/index.tsx`
- Fix implemented:
  - Added global exception handling that returns sanitized error payloads.
  - Added consistent success response wrapping on the backend.
  - Added centralized request logging without leaking secrets.
  - Added frontend global error and loading states.

#### 7. Unsafe production startup defaults
- Severity: High
- Files changed:
  - `apps/backend/src/main.ts`
  - `apps/backend/src/config/app.config.ts`
  - `apps/backend/.env.example`
  - `apps/backend/src/health.controller.ts`
- Fix implemented:
  - Added startup validation for secrets and database configuration.
  - Fixed `.env.example` mismatches, including Razorpay key names and Mongo defaults.
  - Added health endpoint and graceful shutdown hooks.
  - Tightened CORS and Helmet initialization.

### Medium

#### 8. Invalid booking state transitions
- Severity: Medium
- Files changed:
  - `apps/backend/src/admin/admin.service.ts`
  - `apps/backend/src/staff/staff.service.ts`
- Fix implemented:
  - Added transition validation so bookings cannot move through invalid states.
  - Blocked unsafe direct rescheduling through the generic admin update endpoint.

#### 9. N+1 and inefficient slot calendar reads
- Severity: Medium
- Files changed:
  - `apps/backend/src/slots/slots.service.ts`
- Fix implemented:
  - Batched calendar booking counts with aggregation instead of repeated per-day queries.
  - Reused closure data instead of refetching it for each day.

#### 10. Missing or weak schema protections
- Severity: Medium
- Files changed:
  - `apps/backend/src/database/schemas/availability.schema.ts`
  - `apps/backend/src/database/schemas/booking.schema.ts`
  - `apps/backend/src/database/schemas/checkin.schema.ts`
  - `apps/backend/src/database/schemas/closure.schema.ts`
  - `apps/backend/src/database/schemas/staff.schema.ts`
  - `apps/backend/src/database/schemas/user.schema.ts`
- Fix implemented:
  - Added indexes for common lookup paths.
  - Marked password and secret token fields as non-selectable.
  - Added schema support for secure booking access and slot occupancy.

#### 11. Unsafe placeholder routes left enabled
- Severity: Medium
- Files changed:
  - `apps/backend/src/auth/auth.controller.ts`
  - `apps/backend/src/auth/auth.service.ts`
  - `apps/backend/src/users/users.service.ts`
  - `apps/backend/src/app.module.ts`
- Fix implemented:
  - Removed fake token behavior from generic auth endpoints.
  - Stopped returning a hardcoded fake user profile.
  - Removed the unused placeholder `CheckinsModule` from the active application graph.

#### 12. Frontend hydration and resilience issues in booking flow
- Severity: Medium
- Files changed:
  - `apps/frontend/store/booking-store.ts`
  - `apps/frontend/features/booking/booking-flow.tsx`
- Fix implemented:
  - Enabled explicit persisted-store rehydration to reduce hydration mismatch risk.
  - Carried secure confirmation access keys through booking completion flows.

## Verification Performed
- `pnpm --filter @karali/backend lint`
- `pnpm --filter @karali/backend build`
- `pnpm --filter @karali/backend test -- --runInBand`
- `pnpm --filter @karali/frontend lint`
- `pnpm --filter @karali/frontend build`

## Remaining Recommendations
- Move the env-based admin account to a database-backed identity model or external IdP if multi-admin management is required.
- Replace the in-memory auth rate limiter with a distributed store such as Redis before scaling beyond a single backend instance.
- Add a dedicated, safe rescheduling flow that reallocates slot occupancy instead of blocking `date`/`time` edits.
- Run full seeded end-to-end browser tests for customer, staff, and admin flows in a deployed environment with MongoDB and real session cookies; the current pass verified builds and backend tests, but not live browser automation against a running stack.
