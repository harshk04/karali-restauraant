"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Input } from "@karali/ui";
import { api } from "../../../lib/api";

type BookingRecord = {
  bookingId: string;
  customerName: string;
  date: string;
  time: string;
  pax: number;
  source?: string;
  status: string;
  paymentStatus: string;
};

export default function ManualBookingPage() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    date: today,
    time: "11:00",
    pax: "2",
    specialRequest: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-manual-bookings"],
    queryFn: async () => (await api.get<BookingRecord[]>("/admin/bookings")).data,
  });

  const todayManualBookings = useMemo(() => {
    return bookings
      .filter((booking) => booking.source === "manual" && booking.date === today)
      .sort((left, right) => left.time.localeCompare(right.time));
  }, [bookings, today]);

  async function submit() {
    setLoading(true);
    setMessage("");
    try {
      const response = await api.post("/admin/bookings/manual", {
        ...form,
        pax: Number(form.pax),
      });
      setMessage(`Booking created: ${response.data.bookingId}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-manual-bookings"] });
      setForm({
        customerName: "",
        email: "",
        phone: "",
        date: today,
        time: "11:00",
        pax: "2",
        specialRequest: "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="grid gap-5 p-8 md:grid-cols-2">
        <Input
          className="min-w-0"
          value={form.customerName}
          onChange={(event: { target: { value: string } }) =>
            setForm({ ...form, customerName: event.target.value })
          }
          placeholder="Guest name"
        />
        <Input
          className="min-w-0"
          value={form.email}
          onChange={(event: { target: { value: string } }) =>
            setForm({ ...form, email: event.target.value })
          }
          placeholder="Email"
        />
        <Input
          className="min-w-0"
          value={form.phone}
          onChange={(event: { target: { value: string } }) =>
            setForm({ ...form, phone: event.target.value })
          }
          placeholder="Mobile number"
        />
        <Input
          className="min-w-0"
          value={form.pax}
          onChange={(event: { target: { value: string } }) =>
            setForm({ ...form, pax: event.target.value })
          }
          placeholder="Guests"
          type="number"
          min="1"
        />
        <Input
          className="min-w-0"
          value={form.date}
          onChange={(event: { target: { value: string } }) =>
            setForm({ ...form, date: event.target.value })
          }
          type="date"
        />
        <Input
          className="min-w-0"
          value={form.time}
          onChange={(event: { target: { value: string } }) =>
            setForm({ ...form, time: event.target.value })
          }
          type="time"
        />
        <div className="md:col-span-2">
          <Input
            className="min-w-0"
            value={form.specialRequest}
            onChange={(event: { target: { value: string } }) =>
              setForm({ ...form, specialRequest: event.target.value })
            }
            placeholder="Special request"
          />
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={loading} onClick={submit}>
          {loading ? "Creating..." : "Create Booking"}
        </Button>
        {message ? <div className="lux-chip">{message}</div> : null}
      </div>

      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="lux-heading text-2xl font-semibold text-[#231a13]">
            Today&apos;s Manual Bookings
          </h2>
          <div className="text-sm text-[#554336]">{today}</div>
        </div>

        {todayManualBookings.length ? (
          <div className="space-y-3">
            {todayManualBookings.map((booking) => (
              <div
                key={booking.bookingId}
                className="flex min-w-0 flex-col gap-2 rounded-[24px] border border-[#e8d9cd] bg-[#fffaf5] p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold text-[#231a13]">
                    {booking.customerName}
                  </div>
                  <div className="break-words text-sm text-[#554336]">
                    {booking.bookingId} · {booking.time} · {booking.pax} guests
                  </div>
                </div>
                <div className="text-sm font-medium text-[#8f4a00]">
                  {booking.status} · {booking.paymentStatus}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[#554336]">
            No manual bookings created for today yet.
          </div>
        )}
      </Card>
    </div>
  );
}
