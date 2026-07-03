import { Navbar } from "@karali/ui";
import { BookingFlow } from "../../features/booking/booking-flow";

export default function BookPage() {
  return (
    <main>
      <Navbar />
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-16 lg:py-16">
        <BookingFlow />
      </div>
    </main>
  );
}
