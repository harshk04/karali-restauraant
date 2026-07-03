import { Button, Card, Navbar, QRViewer } from "@karali/ui";
import { api } from "../../../lib/api";

export const dynamic = "force-dynamic";

type BookingQr = {
  bookingId: string;
  customerName: string;
  date: string;
  time: string;
  pax: number;
  signature: string;
  expiry: string;
  qrCode: string;
};

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams?: Promise<{ bookingId?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const bookingId = params.bookingId ?? "KR-9284-LX";
  let qr: BookingQr = {
    bookingId,
    customerName: "Guest",
    date: "Today",
    time: "12:00",
    pax: 2,
    signature: "",
    expiry: "",
    qrCode: JSON.stringify({ bookingId }),
  };

  try {
    const response = await api.get(`/qr/${bookingId}`);
    qr = response.data as BookingQr;
  } catch {
    // Fall back to a graceful confirmation card if the QR lookup is unavailable.
  }

  return (
    <main>
      <Navbar />

      <div className="mx-auto max-w-[1280px] px-5 py-10 lg:px-16 lg:py-16">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-[#8f4a00] text-white shadow-[0_20px_50px_-12px_rgba(143,74,0,0.18)]">
            <span className="text-5xl">✓</span>
          </div>
          <h1 className="text-5xl font-bold text-[#8f4a00]">Your booking is confirmed!</h1>
          <p className="mt-4 text-[18px] text-[#554336]">Get ready for an exquisite dining experience at Terminal 5.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="space-y-8 lg:col-span-7">
            <div className="flex items-start justify-between border-b border-[#dcc2b1] pb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#554336]/60">Reservation Status</p>
                <h2 className="mt-1 text-[28px] font-bold text-[#231a13]">Confirmed</h2>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#554336]/60">Booking ID</p>
                <p className="mt-1 text-[28px] font-bold text-[#8f4a00]">{qr.bookingId}</p>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                ["📅", "Date", qr.date],
                ["🕒", "Time", qr.time],
                ["👥", "Guests", `${String(qr.pax).padStart(2, "0")} People`],
                ["📍", "Location", "Karali Lounge, Level 3"],
              ].map(([icon, label, value]) => (
                <div key={label} className={label === "Location" ? "md:col-span-3" : ""}>
                  <div className="mb-2 text-2xl text-[#8f4a00]">{icon}</div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">{label}</p>
                  <p className="mt-1 text-[18px] font-semibold text-[#231a13]">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-[#e8d9cd] bg-[#fbefe6] p-6 italic leading-8 text-[#554336]">
              “A quiet window seat has been prioritized for your visit. Our sommelier will be available to guide you through our
              vintage selection upon arrival.”
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button variant="secondary" className="w-full text-base">
                View My Bookings
              </Button>
              <Button variant="secondary" className="w-full text-base">
                Book Again
              </Button>
            </div>
          </Card>

          <div className="space-y-6 lg:col-span-5">
            <Card className="space-y-6 p-8 text-center">
              <h3 className="text-[28px] font-bold text-[#231a13]">Digital Entry Pass</h3>
              <p className="text-[#554336]">Scan at the concierge desk</p>
              <div className="mx-auto rounded-[36px] bg-white p-5 shadow-[0_20px_50px_-12px_rgba(143,74,0,0.15)]">
                <QRViewer value={qr.qrCode || JSON.stringify(qr)} />
              </div>
              <Button type="button" className="w-full text-lg">
                Download QR
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" type="button">
                  Calendar
                </Button>
                <Button variant="secondary" type="button">
                  Share
                </Button>
              </div>
            </Card>

            <Card className="flex items-center gap-4 bg-[#f5e0cf] p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#8f4a00]">🍷</div>
              <div className="flex-1">
                <div className="text-[20px] font-semibold text-[#231a13]">Pre-order Drinks?</div>
                <div className="text-sm text-[#554336]">View our signature wine list</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#8f4a00]">→</div>
            </Card>
          </div>
        </div>

        <footer className="mt-16 border-t border-[#dcc2b1] pt-10">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <div className="text-3xl font-bold text-[#8f4a00]">Karali</div>
              <div className="mt-2 text-sm text-[#554336]">© 2024 Karali Luxury Dining. All Rights Reserved.</div>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-[#554336] underline">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Sustainability</a>
              <a href="#">Accessibility</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
