# Stitch Migration Notes

## Extracted Modules

- `karali_luxury_airport_dining_home` -> landing page, hero, bento benefits, gallery framing
- `book_a_table_karali` -> booking stepper, date picker, time slots, table map, summary sidebar
- `guest_details_payment_karali` -> guest form, payment method selection, checkout card layout
- `reservation_confirmed_karali` -> confirmation state, QR pass, booking summary card, next actions
- `staff_operations_karali` -> staff dashboard, live arrivals, check-in controls, offline queue
- `admin_portal_karali_dashboard` -> admin overview, metrics, operational panels, management table
- `karali_design_system` -> saffron palette, glass cards, rounded radii, Poppins/Inter typography

## Design Tokens Preserved

- Warm off-white surfaces
- Saffron primary color
- Glassmorphism cards with blurred translucent white
- Rounded 32px cards and pill controls
- 8px spacing rhythm
- Poppins headings, Inter body text

## Implementation Notes

- The exported HTML files are not carried forward into the application.
- The new code uses reusable React components and route-based screens.
- The backend is structured for real data sources even where the first pass is stubbed.
