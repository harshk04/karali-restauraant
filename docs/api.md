# API Overview

## Authentication

- `POST /api/auth/login`
- `POST /api/auth/refresh`

## Users

- `GET /api/users/me`

## Bookings

- `GET /api/bookings`
- `GET /api/bookings/:id`
- `POST /api/bookings`

## Tables

- `GET /api/tables`

## QR

- `GET /api/qr/:bookingId`

## Check-ins

- `POST /api/checkins`

## Payments

- `POST /api/payments/razorpay/create-order`
