import { Suspense } from "react";
import { BookingFlow } from "../../features/booking/booking-flow";

export default function BookPage() {
  return (
    <main className="booking_theme_page">
      <div className="mx-auto max-w-[1280px] px-5 py-10 lg:px-16 lg:py-16">
        <Suspense fallback={null}>
          <BookingFlow />
        </Suspense>
      </div>
    </main>
  );
}
