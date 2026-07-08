"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, QrCode } from "lucide-react";
import { AnalyticsCard, Button, Card, DataTable } from "@karali/ui";
import { staffApi } from "../../../lib/staff-api";

type StaffDashboard = {
  todaysReservations: number;
  todaysCheckins: number;
  pendingCheckins: number;
  walkInsToday: number;
  recentCheckins: Array<{
    bookingId: string;
    customerName: string;
    time: string;
    status: string;
    checkedInAt: string;
  }>;
  recentBookings: Array<{
    bookingId: string;
    customerName: string;
    time: string;
    status: string;
    paymentStatus: string;
  }>;
};

export default function StaffDashboardPage() {
  const { data } = useQuery({
    queryKey: ["staff-dashboard"],
    queryFn: async () => (await staffApi.get<StaffDashboard>("/staff/dashboard")).data,
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard title="Today's Reservations" value={String(data?.todaysReservations ?? 0)} />
        <AnalyticsCard title="Today's Check-ins" value={String(data?.todaysCheckins ?? 0)} />
        <AnalyticsCard title="Pending Check-ins" value={String(data?.pendingCheckins ?? 0)} />
        <AnalyticsCard title="Walk-ins Today" value={String(data?.walkInsToday ?? 0)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="space-y-4 xl:col-span-4">
          <p className="text-xs uppercase tracking-[0.3em] text-[#8f4a00]">Primary Action</p>
          <h2 className="lux-heading text-3xl font-bold text-[#231a13]">Scan QR</h2>
          <p className="text-sm text-[#554336]">
            Open the QR scanner to validate the guest and complete check-in.
          </p>
          <Button href="/staff/scanner" className="w-full">
            <QrCode className="h-4 w-4" />
            Scan QR
          </Button>
        </Card>

        <Card className="space-y-4 xl:col-span-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="lux-heading text-2xl font-semibold text-[#231a13]">Recent Check-ins</h2>
            <Button href="/staff/checkins" variant="secondary">
              View All
            </Button>
          </div>
          <DataTable
            columns={[
              { key: "bookingId", label: "Booking ID" },
              { key: "customerName", label: "Customer" },
              { key: "time", label: "Time" },
              { key: "status", label: "Status" },
            ]}
            rows={(data?.recentCheckins || []).map((item) => ({
              ...item,
              checkedInAt: item.checkedInAt || "",
            }))}
          />
        </Card>
      </section>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="lux-heading text-2xl font-semibold text-[#231a13]">Today's Activity</h2>
          <Button href="/staff/checkins" variant="secondary">
            <ArrowRight className="h-4 w-4" />
            Check-ins
          </Button>
        </div>
        <DataTable
          columns={[
            { key: "bookingId", label: "Booking ID" },
            { key: "customerName", label: "Customer" },
            { key: "time", label: "Time" },
            { key: "paymentStatus", label: "Payment" },
            { key: "status", label: "Status" },
          ]}
          rows={data?.recentBookings || []}
        />
      </Card>
    </div>
  );
}
