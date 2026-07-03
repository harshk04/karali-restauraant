"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DataTable, Input } from "@karali/ui";
import { api } from "../../../lib/api";

type BookingRecord = {
  bookingId: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  pax: number;
  status: string;
  paymentStatus: string;
  specialRequest?: string;
};

const actions = [
  { label: "Check In", endpoint: "check-in" },
  { label: "Complete", endpoint: "complete" },
  { label: "No Show", endpoint: "no-show" },
  { label: "Cancel", endpoint: "cancel" },
] as const;

export default function AdminBookingsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings", search],
    queryFn: async () => (await api.get<BookingRecord[]>("/admin/bookings", { params: { search } })).data,
  });

  async function updateBooking(bookingId: string, action: (typeof actions)[number]["endpoint"]) {
    await api.post(`/admin/bookings/${bookingId}/${action}`);
    await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  }

  const filteredBookings = useMemo(() => bookings, [bookings]);

  return (
    <div className="space-y-8 px-6 py-10 md:px-16">
      <section className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#231a13]">Bookings</h2>
            <p className="text-[#554336]">Search, check in, complete, cancel, and mark no-shows.</p>
          </div>
          <div className="flex gap-3">
            <Input value={search} onChange={(event: { target: { value: string } }) => setSearch(event.target.value)} placeholder="Search bookings" />
            <Button href="/admin/manual-booking">Manual Booking</Button>
          </div>
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
              { key: "paymentStatus", label: "Payment" },
            ]}
            rows={filteredBookings.map((booking) => ({
              ...booking,
              pax: String(booking.pax),
            }))}
          />
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="text-2xl font-semibold text-[#231a13]">Quick actions</h3>
        {filteredBookings.slice(0, 8).map((booking) => (
          <Card key={booking.bookingId} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-[#231a13]">{booking.customerName}</div>
              <div className="text-sm text-[#554336]">
                {booking.bookingId} · {booking.date} · {booking.time} · {booking.pax} guests
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button key={action.endpoint} type="button" variant="secondary" onClick={() => updateBooking(booking.bookingId, action.endpoint)}>
                  {action.label}
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
