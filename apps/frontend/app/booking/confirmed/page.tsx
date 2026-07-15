import { Button, Card, QRViewer } from "@karali/ui";
import { addMinutes, format, isValid, parseISO } from "date-fns";
import { api } from "../../../lib/api";
import { DownloadQrButton } from "./download-qr-button";

export const dynamic = "force-dynamic";

function guestCountLabel(pax: number) {
  return pax >= 6 ? "5+" : String(pax);
}

const karaliMapsHref =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("Karali Restaurant, Jaipur International Airport, Land Side, T2, Jaipur");

const karaliLocation =
  "Karali Restaurant, Jaipur International Airport, Land Side, T2, Jaipur";

function toCalendarDateTime(dateText: string, timeText: string) {
  const parsedDate = parseISO(dateText);
  const baseDate = isValid(parsedDate) ? parsedDate : new Date();
  const [hours, minutes] = timeText.split(":").map((value) => Number(value));
  const eventStart = new Date(baseDate);

  eventStart.setHours(
    Number.isFinite(hours) ? hours : 19,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0,
  );

  const eventEnd = addMinutes(eventStart, 90);

  return {
    start: format(eventStart, "yyyyMMdd'T'HHmmss"),
    end: format(eventEnd, "yyyyMMdd'T'HHmmss"),
  };
}

function buildCalendarHref(qr: BookingQr) {
  const { start, end } = toCalendarDateTime(qr.date, qr.time);
  const title = `Karali Restaurant reservation - ${qr.customerName}`;
  const details = [
    `Booking ID: ${qr.bookingId}`,
    `Guest: ${qr.customerName}`,
    `Party size: ${qr.pax}`,
    `Date: ${qr.date}`,
    `Time: ${qr.time}`,
    `Location: ${karaliLocation}`,
  ].join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details,
    location: karaliLocation,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

type BookingQr = {
  bookingId: string;
  customerName: string;
  date: string;
  time: string;
  pax: number;
  expiry: string;
  qrCode: string;
};

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams?: Promise<{ bookingId?: string; accessKey?: string; shareToken?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const bookingId = params.bookingId ?? "KR-9284-LX";
  const accessKey = params.accessKey ?? "";
  const shareToken = params.shareToken ?? "";
  let qr: BookingQr = {
    bookingId,
    customerName: "Guest",
    date: "Today",
    time: "12:00",
    pax: 2,
    expiry: "",
    qrCode: JSON.stringify({ bookingId }),
  };

  try {
    const response = await api.get(`/qr/${bookingId}`, {
      params: shareToken ? { shareToken } : { accessKey },
    });
    qr = response.data as BookingQr;
  } catch {
    // Fall back to a graceful confirmation card if the QR lookup is unavailable.
  }

  const calendarHref = buildCalendarHref(qr);

  return (
    <main className="booking_theme_page booking_confirmation_page">
      <div className="mx-auto max-w-[1280px] px-5 py-10 lg:px-16 lg:py-16">
        <div className="lux-hero lux-reveal booking_theme_hero mb-12 p-6 text-center sm:p-8 md:p-12">
          <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-[#8f4a00] text-white shadow-[0_20px_50px_-12px_rgba(143,74,0,0.18)]">
            <span className="text-5xl">✓</span>
          </div>
          <p className="lux-eyebrow">Reservation Complete</p>
          <h1 className="lux-heading mx-auto mt-3 max-w-[12ch] text-3xl font-bold leading-[1.08] text-[#8f4a00] sm:max-w-none sm:text-5xl">
            Your booking is confirmed!
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#554336] sm:text-[18px]">
            We look forward to welcoming you at Karali Restaurant, Jaipur International Airport.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lux-panel-strong space-y-8 p-8 lg:col-span-7">
            <div className="flex flex-col gap-5 border-b border-[#dcc2b1] pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#554336]/60">
                  Reservation Status
                </p>
                <h2 className="lux-heading mt-1 text-[28px] font-bold text-[#231a13]">
                  Confirmed
                </h2>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#554336]/60">
                  Booking ID
                </p>
                <p className="lux-heading mt-1 break-words text-[22px] font-bold text-[#8f4a00] sm:text-[28px]">
                  {qr.bookingId}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8">
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
                label === "Location" ? (
                  <a
                    key={label}
                    href={karaliMapsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="col-span-2 md:col-span-3 rounded-[20px] border border-[#ead9ca] bg-white/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#8f4a00]/40 hover:bg-white"
                  >
                    <div className="mb-2 text-2xl text-[#8f4a00]">{icon}</div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                      {label}
                    </p>
                    <p className="lux-heading mt-1 text-[16px] font-semibold text-[#231a13] sm:text-[18px]">
                      {value}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[#8f4a00]">
                      Tap to open maps
                    </p>
                  </a>
                ) : (
                  <div key={label} className="col-span-1">
                    <div className="mb-2 text-2xl text-[#8f4a00]">{icon}</div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                      {label}
                    </p>
                    <p className="lux-heading mt-1 text-[16px] font-semibold text-[#231a13] sm:text-[18px]">
                      {value}
                    </p>
                  </div>
                )
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
            <Card className="lux-panel-strong space-y-5 p-4 text-center sm:space-y-6 sm:p-8">
              <h3 className="lux-heading text-[24px] font-bold text-[#231a13] sm:text-[28px]">
                Digital Entry Pass
              </h3>
              <p className="text-sm text-[#554336] sm:text-base">
                Scan at the concierge desk
              </p>
              <div className="mx-auto w-full max-w-[15rem] rounded-[28px] bg-white p-3 shadow-[0_20px_50px_-12px_rgba(143,74,0,0.15)] sm:max-w-none sm:rounded-[36px] sm:p-5">
                <QRViewer value={qr.qrCode || JSON.stringify(qr)} />
              </div>
              <DownloadQrButton
                qrCode={qr.qrCode || ""}
                bookingId={qr.bookingId}
              />
              <div className="grid grid-cols-2 gap-3">
                <Button
                  href={calendarHref}
                  target="_blank"
                  rel="noreferrer"
                  variant="secondary"
                  type="button"
                >
                  Calendar
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col gap-4 bg-[#f5e0cf] p-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4 sm:flex-1">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#8f4a00]">
                  🍷
                </div>
                <div>
                  <div className="lux-heading text-[20px] font-semibold text-[#231a13]">
                    Need another table?
                  </div>
                  <div className="text-sm text-[#554336]">
                    Start a fresh reservation in a few clicks
                  </div>
                </div>
              </div>
              <Button href="/book" variant="secondary" className="w-full sm:w-auto">
                Need another table
              </Button>
            </Card>
          </div>
        </div>

      </div>
    </main>
  );
}
