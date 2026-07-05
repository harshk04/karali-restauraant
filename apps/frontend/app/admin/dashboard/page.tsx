"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalyticsCard, Button, Card, DataTable } from "@karali/ui";
import { api } from "../../../lib/api";

type BookingRecord = {
  bookingId: string;
  customerName: string;
  date: string;
  time: string;
  pax: number;
  status: string;
  paymentStatus: string;
};

export default function AdminDashboardPage() {
  const { data: dashboard } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => (await api.get("/admin/dashboard")).data,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-dashboard-bookings"],
    queryFn: async () =>
      (await api.get<BookingRecord[]>("/admin/bookings")).data,
  });

  return (
    <div className="space-y-8">
      <section className="lux-hero lux-reveal p-8 md:p-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="lux-eyebrow">Terminal 5 Snapshot</p>
            <h2 className="lux-heading mt-3 text-4xl font-bold text-[#231a13] md:text-5xl">
              Dashboard overview
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-[#554336]">
              Bookings, revenue, occupancy, and guest momentum in one calm
              command surface.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="lux-chip">Live ops</div>
            <div className="lux-chip">Luxury floor service active</div>
          </div>
        </div>
        <div className="mt-8 grid gap-4 xl:grid-cols-4">
          <AnalyticsCard
            title="Total Bookings"
            value={String(dashboard?.totalBookings ?? 0)}
            delta="All time"
            subtitle="Confirmed reservations across the platform."
          />
          <AnalyticsCard
            title="Today's Bookings"
            value={String(dashboard?.todaysBookings ?? 0)}
            delta="Today"
            subtitle="Expected guest arrivals for the active service window."
          />
          <AnalyticsCard
            title="Upcoming"
            value={String(dashboard?.upcomingBookings ?? 0)}
            delta="Queued"
            subtitle="Future reservations still awaiting arrival or completion."
          />
          <AnalyticsCard
            title="Revenue"
            value={`₹${Number(dashboard?.revenue ?? 0).toFixed(0)}`}
            delta="Gross"
            subtitle="Captured booking value including prepaid reservations."
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          { label: "Manage bookings", href: "/admin/bookings" },
          { label: "Create booking", href: "/admin/manual-booking" },
          { label: "Set availability", href: "/admin/availability" },
        ].map((item) => (
          <Card key={item.label} className="lux-panel-strong space-y-4 p-8">
            <div className="text-sm uppercase tracking-[0.3em] text-[#8f4a00]">
              {item.label}
            </div>
            <div className="lux-heading text-2xl font-semibold text-[#231a13]">
              Open {item.label.toLowerCase()}
            </div>
            <p className="text-sm text-[#554336]">
              {item.href === "/admin/bookings"
                ? "Check in, complete, cancel, or recover no-shows."
                : item.href === "/admin/manual-booking"
                  ? "Capture concierge, lounge, or phone reservations fast."
                  : "Adjust service hours, closures, and booking windows."}
            </p>
            <Button
              variant="secondary"
              type="button"
              className="w-full"
              href={item.href}
            >
              Go
            </Button>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="lux-heading text-2xl font-semibold text-[#231a13]">
            Recent bookings
          </h2>
          <p className="text-sm text-[#554336]">
            Latest activity from the restaurant floor.
          </p>
        </div>
        <Card className="overflow-hidden p-0">
          <DataTable
            columns={[
              { key: "bookingId", label: "Booking ID" },
              { key: "customerName", label: "Guest" },
              { key: "date", label: "Date" },
              { key: "time", label: "Time" },
              { key: "pax", label: "Guests" },
              { key: "status", label: "Status" },
            ]}
            rows={bookings.slice(0, 8).map((booking) => ({
              ...booking,
              pax: String(booking.pax),
            }))}
          />
        </Card>
      </section>
    </div>
  );
}
