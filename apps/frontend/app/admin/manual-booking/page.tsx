"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, Input } from "@karali/ui";
import { api } from "../../../lib/api";

export default function ManualBookingPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    pax: "2",
    specialRequest: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      setForm({
        customerName: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        pax: "2",
        specialRequest: "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="lux-hero lux-reveal p-8 md:p-10">
        <p className="lux-eyebrow">Concierge Capture</p>
        <h2 className="lux-heading mt-3 text-4xl font-bold text-[#231a13]">
          Manual booking
        </h2>
        <p className="mt-2 max-w-2xl text-[#554336]">
          Create polished walk-in or phone reservations without leaving the
          premium control surface.
        </p>
      </div>

      <Card className="grid gap-5 p-8 md:grid-cols-2">
        <Input
          value={form.customerName}
          onChange={(event: { target: { value: string } }) =>
            setForm({ ...form, customerName: event.target.value })
          }
          placeholder="Guest name"
        />
        <Input
          value={form.email}
          onChange={(event: { target: { value: string } }) =>
            setForm({ ...form, email: event.target.value })
          }
          placeholder="Email"
        />
        <Input
          value={form.phone}
          onChange={(event: { target: { value: string } }) =>
            setForm({ ...form, phone: event.target.value })
          }
          placeholder="Mobile number"
        />
        <Input
          value={form.pax}
          onChange={(event: { target: { value: string } }) =>
            setForm({ ...form, pax: event.target.value })
          }
          placeholder="Guests"
        />
        <Input
          value={form.date}
          onChange={(event: { target: { value: string } }) =>
            setForm({ ...form, date: event.target.value })
          }
          placeholder="Date YYYY-MM-DD"
        />
        <Input
          value={form.time}
          onChange={(event: { target: { value: string } }) =>
            setForm({ ...form, time: event.target.value })
          }
          placeholder="Time HH:MM"
        />
        <div className="md:col-span-2">
          <Input
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
    </div>
  );
}
