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
    queryFn: async () => (await api.get<BookingRecord[]>("/admin/bookings")).data,
  });

  return (
    <div className="space-y-8 px-6 py-10 md:px-16">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#231a13]">Dashboard</h2>
            <p className="text-[#554336]">Bookings, revenue, and occupancy at a glance.</p>
          </div>
          <div className="rounded-2xl bg-[#fff1e9] px-4 py-3 text-sm font-semibold text-[#8f4a00]">Live ops</div>
        </div>
        <div className="grid gap-4 xl:grid-cols-4">
          <AnalyticsCard title="Total Bookings" value={String(dashboard?.totalBookings ?? 0)} delta="" subtitle="" />
          <AnalyticsCard title="Today's Bookings" value={String(dashboard?.todaysBookings ?? 0)} delta="" subtitle="" />
          <AnalyticsCard title="Upcoming" value={String(dashboard?.upcomingBookings ?? 0)} delta="" subtitle="" />
          <AnalyticsCard title="Revenue" value={`₹${Number(dashboard?.revenue ?? 0).toFixed(0)}`} delta="" subtitle="" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          { label: "Manage bookings", href: "/admin/bookings" },
          { label: "Create booking", href: "/admin/manual-booking" },
          { label: "Set availability", href: "/admin/availability" },
        ].map((item) => (
          <Card key={item.label} className="space-y-3">
            <div className="text-sm uppercase tracking-[0.3em] text-[#8f4a00]">{item.label}</div>
            <div className="text-xl font-semibold text-[#231a13]">Open {item.label.toLowerCase()}</div>
            <Button variant="secondary" type="button" className="w-full" href={item.href}>
              Go
            </Button>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#231a13]">Recent bookings</h2>
          <p className="text-sm text-[#554336]">Latest activity from the restaurant floor.</p>
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
