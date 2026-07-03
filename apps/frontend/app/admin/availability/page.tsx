"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Input } from "@karali/ui";
import { api } from "../../../lib/api";

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const { data: availability } = useQuery({
    queryKey: ["admin-availability"],
    queryFn: async () => (await api.get("/admin/availability")).data,
  });
  const [timing, setTiming] = useState({ openTime: "11:00", closeTime: "22:00", slotDurationMins: 60 });
  const [closure, setClosure] = useState({ startDate: "", endDate: "", reason: "" });

  async function saveTiming() {
    await api.post("/admin/availability/timing", timing);
    await queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
  }

  async function saveClosure() {
    await api.post("/admin/availability/closures", closure);
    await queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
  }

  return (
    <div className="space-y-8 px-6 py-10 md:px-16">
      <div>
        <h2 className="text-3xl font-bold text-[#231a13]">Availability</h2>
        <p className="text-[#554336]">Control timings, closures, and overrides.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h3 className="text-2xl font-semibold text-[#231a13]">Global timing</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={timing.openTime} onChange={(event: { target: { value: string } }) => setTiming({ ...timing, openTime: event.target.value })} placeholder="Open time" />
            <Input value={timing.closeTime} onChange={(event: { target: { value: string } }) => setTiming({ ...timing, closeTime: event.target.value })} placeholder="Close time" />
            <Input value={String(timing.slotDurationMins)} onChange={(event: { target: { value: string } }) => setTiming({ ...timing, slotDurationMins: Number(event.target.value) })} placeholder="Slot mins" />
          </div>
          <Button onClick={saveTiming}>Save timing</Button>
          <div className="text-sm text-[#554336]">
            Current: {availability?.timing?.openTime || "11:00"} - {availability?.timing?.closeTime || "22:00"}
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-2xl font-semibold text-[#231a13]">Close dates</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={closure.startDate} onChange={(event: { target: { value: string } }) => setClosure({ ...closure, startDate: event.target.value })} placeholder="Start date" />
            <Input value={closure.endDate} onChange={(event: { target: { value: string } }) => setClosure({ ...closure, endDate: event.target.value })} placeholder="End date" />
            <Input value={closure.reason} onChange={(event: { target: { value: string } }) => setClosure({ ...closure, reason: event.target.value })} placeholder="Reason" />
          </div>
          <Button onClick={saveClosure}>Save closure</Button>
        </Card>
      </div>
    </div>
  );
}
