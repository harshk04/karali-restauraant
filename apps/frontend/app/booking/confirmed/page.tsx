import { Button, Card, QRViewer } from "@karali/ui";
import { api } from "../../../lib/api";
import { DownloadQrButton } from "./download-qr-button";

export const dynamic = "force-dynamic";

function guestCountLabel(pax: number) {
  return pax >= 6 ? "5+" : String(pax);
}

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
    <main className="booking_theme_page booking_confirmation_page">
      <div className="mx-auto max-w-[1280px] px-5 py-10 lg:px-16 lg:py-16">
        <div className="lux-hero lux-reveal booking_theme_hero mb-12 p-8 text-center md:p-12">
          <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-[#8f4a00] text-white shadow-[0_20px_50px_-12px_rgba(143,74,0,0.18)]">
            <span className="text-5xl">✓</span>
          </div>
          <p className="lux-eyebrow">Reservation Complete</p>
          <h1 className="lux-heading mt-3 text-5xl font-bold text-[#8f4a00]">
            Your booking is confirmed!
          </h1>
          <p className="mt-4 text-[18px] text-[#554336]">
            We look forward to welcoming you at Karali Restaurant, Jaipur International Airport.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lux-panel-strong space-y-8 p-8 lg:col-span-7">
            <div className="flex items-start justify-between border-b border-[#dcc2b1] pb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#554336]/60">
                  Reservation Status
                </p>
                <h2 className="lux-heading mt-1 text-[28px] font-bold text-[#231a13]">
                  Confirmed
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#554336]/60">
                  Booking ID
                </p>
                <p className="lux-heading mt-1 text-[28px] font-bold text-[#8f4a00]">
                  {qr.bookingId}
                </p>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                ["📅", "Date", qr.date],
                ["🕒", "Time", qr.time],
                ["👥", "Guests", guestCountLabel(qr.pax)],
                [
                  "📍",
                  "Location",
                  "Jaipur International Airport, Land Side, T2, Jaipur",
                ],
              ].map(([icon, label, value]) => (
                <div
                  key={label}
                  className={label === "Location" ? "md:col-span-3" : ""}
                >
                  <div className="mb-2 text-2xl text-[#8f4a00]">{icon}</div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                    {label}
                  </p>
                  <p className="lux-heading mt-1 text-[18px] font-semibold text-[#231a13]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-[#e8d9cd] bg-[#fbefe6] p-6 italic leading-8 text-[#554336]">
              “Your table reservation has been recorded. Please arrive a little
              ahead of time for a smooth dining experience before your journey.”
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                href="/"
                variant="secondary"
                className="w-full text-base"
              >
                Back to Home
              </Button>
              <Button
                href="/book"
                variant="secondary"
                className="w-full text-base"
              >
                Book Again
              </Button>
            </div>
          </Card>

          <div className="space-y-6 lg:col-span-5">
            <Card className="lux-panel-strong space-y-6 p-8 text-center">
              <h3 className="lux-heading text-[28px] font-bold text-[#231a13]">
                Digital Entry Pass
              </h3>
              <p className="text-[#554336]">Scan at the concierge desk</p>
              <div className="mx-auto rounded-[36px] bg-white p-5 shadow-[0_20px_50px_-12px_rgba(143,74,0,0.15)]">
                <QRViewer value={qr.qrCode || JSON.stringify(qr)} />
              </div>
              <DownloadQrButton
                qrCode={qr.qrCode || ""}
                bookingId={qr.bookingId}
              />
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#8f4a00]">
                🍷
              </div>
              <div className="flex-1">
                <div className="lux-heading text-[20px] font-semibold text-[#231a13]">
                  Need another table?
                </div>
                <div className="text-sm text-[#554336]">
                  Start a fresh reservation in a few clicks
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#8f4a00]">
                →
              </div>
            </Card>
          </div>
        </div>

      </div>
    </main>
  );
}
