"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsCard, Button, Card, DataTable } from "@karali/ui";
import { api } from "../../../lib/api";
import { BookingDetailsModal, type BookingRecord } from "../../../features/admin/booking-details-modal";

type DayPoint = {
  date: string;
  label: string;
  bookings: number;
  revenue: number;
};

function paymentLabel(booking: BookingRecord) {
  if (booking.paymentStatus === "paid" && booking.totalAmount > 0) {
    return `Paid · Rs. ${booking.totalAmount}`;
  }

  return "Pay at venue";
}

function lastSevenDays(bookings: BookingRecord[]) {
  const points: DayPoint[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let index = 6; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setUTCDate(today.getUTCDate() - index);
    const iso = day.toISOString().slice(0, 10);
    const dayBookings = bookings.filter((booking) => booking.date === iso);
    points.push({
      date: iso,
      label: day.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      bookings: dayBookings.length,
      revenue: dayBookings
        .filter((booking) => booking.paymentStatus === "paid")
        .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0),
    });
  }

  return points;
}

function LineTrend({
  title,
  points,
  valueKey,
  stroke,
  fill,
}: {
  title: string;
  points: DayPoint[];
  valueKey: "bookings" | "revenue";
  stroke: string;
  fill: string;
}) {
  const maxValue = Math.max(...points.map((point) => point[valueKey]), 1);
  const chartWidth = 560;
  const chartHeight = 180;
  const stepX = chartWidth / Math.max(points.length - 1, 1);
  const pathPoints = points.map((point, index) => {
    const value = point[valueKey];
    const x = index * stepX;
    const y = chartHeight - (value / maxValue) * (chartHeight - 24) - 12;
    return { x, y, value, label: point.label, date: point.date };
  });
  const linePath = pathPoints
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
  const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <Card className="lux-panel-strong space-y-5 p-6">
      <div className="lux-heading text-xl font-semibold text-[#231a13]">
        {title}
      </div>
      <div className="overflow-hidden rounded-[28px] border border-[#e8d9cd] bg-[#fffaf5] p-4">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 24}`}
          className="h-56 w-full"
          preserveAspectRatio="none"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = 12 + (chartHeight - 24) * ratio;
            return (
              <line
                key={ratio}
                x1="0"
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#ead7c9"
                strokeDasharray="4 6"
              />
            );
          })}
          <path d={areaPath} fill={fill} opacity="0.25" />
          <path
            d={linePath}
            fill="none"
            stroke={stroke}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {pathPoints.map((point) => (
            <g key={`${valueKey}-${point.date}`}>
              <circle cx={point.x} cy={point.y} r="5" fill={stroke} />
              <circle cx={point.x} cy={point.y} r="10" fill={stroke} opacity="0.14" />
            </g>
          ))}
        </svg>
        <div className="mt-4 grid grid-cols-7 gap-2 text-center">
          {pathPoints.map((point) => (
            <div key={`${valueKey}-label-${point.date}`} className="space-y-1">
              <div className="text-xs font-medium text-[#554336]">
                {valueKey === "revenue" ? `Rs. ${point.value}` : point.value}
              </div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#554336]/70">
                {point.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const { data: dashboard } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => (await api.get("/admin/dashboard")).data,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-dashboard-bookings"],
    queryFn: async () =>
      (await api.get<BookingRecord[]>("/admin/bookings")).data,
  });

  const paidBookings = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus === "paid").length,
    [bookings],
  );

  const previousSevenDays = useMemo(() => lastSevenDays(bookings), [bookings]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((left, right) => {
        if (left.date !== right.date) {
          return right.date.localeCompare(left.date);
        }

        return right.time.localeCompare(left.time);
      })
      .slice(0, 8);
  }, [bookings]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-5">
        <a href="/admin/bookings?scope=all" className="block">
          <AnalyticsCard
            title="Total Bookings"
            value={String(dashboard?.totalBookings ?? 0)}
          />
        </a>
        <a href={`/admin/bookings?scope=active&date=${today}`} className="block">
          <AnalyticsCard
            title="Today's Bookings"
            value={String(dashboard?.todaysBookings ?? 0)}
          />
        </a>
        <a href="/admin/bookings?scope=active" className="block">
          <AnalyticsCard
            title="Upcoming"
            value={String(dashboard?.upcomingBookings ?? 0)}
          />
        </a>
        <a href="/admin/bookings?scope=all&payment=paid" className="block">
          <AnalyticsCard
            title="Revenue"
            value={`₹${Number(dashboard?.revenue ?? 0).toFixed(0)}`}
          />
        </a>
        <a href="/admin/bookings?scope=all&payment=paid" className="block">
          <AnalyticsCard title="Paid" value={String(paidBookings)} />
        </a>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <LineTrend
          title="Bookings · Last 7 Days"
          points={previousSevenDays}
          valueKey="bookings"
          stroke="#8f4a00"
          fill="#f1b98c"
        />
        <LineTrend
          title="Revenue · Last 7 Days"
          points={previousSevenDays}
          valueKey="revenue"
          stroke="#2d5e34"
          fill="#8ec19a"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Bookings", href: "/admin/bookings" },
          { label: "Add Booking", href: "/admin/manual-booking" },
          { label: "Availability", href: "/admin/availability" },
        ].map((item) => (
          <Card key={item.label} className="lux-panel-strong p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="lux-heading text-xl font-semibold text-[#231a13]">
                {item.label}
              </div>
              <Button variant="secondary" type="button" href={item.href}>
                Open
              </Button>
            </div>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="lux-heading text-2xl font-semibold text-[#231a13]">
          Recent Bookings
        </h2>
        <Card className="overflow-hidden p-0">
          <DataTable
            columns={[
              { key: "bookingId", label: "Booking ID" },
              { key: "customerName", label: "Guest" },
              { key: "date", label: "Date" },
              { key: "time", label: "Time" },
              { key: "pax", label: "Guests" },
              { key: "status", label: "Status" },
              { key: "paymentSummary", label: "Payment" },
            ]}
            rows={recentBookings.map((booking) => ({
              ...booking,
              bookingId: (
                <button
                  type="button"
                  className="font-semibold text-[#8f4a00] underline-offset-4 hover:underline"
                  onClick={() => setSelectedBooking(booking)}
                >
                  {booking.bookingId}
                </button>
              ),
              pax: String(booking.pax),
              paymentSummary: paymentLabel(booking),
            }))}
          />
        </Card>
      </section>

      <BookingDetailsModal
        booking={selectedBooking}
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}
