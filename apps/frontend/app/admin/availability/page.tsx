"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Input } from "@karali/ui";
import { api } from "../../../lib/api";

const closureReasonOptions = [
  "Private event",
  "Holiday closure",
  "Maintenance",
  "Kitchen unavailable",
  "Limited staff",
  "Custom reason",
] as const;

type ClosureRecord = {
  startDate: string;
  endDate: string;
  reason?: string;
  active?: boolean;
  displayReasonToCustomers?: boolean;
};

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const { data: availability } = useQuery({
    queryKey: ["admin-availability"],
    queryFn: async () => (await api.get("/admin/availability")).data,
  });
  const [timing, setTiming] = useState({
    openTime: "11:00",
    closeTime: "22:00",
    slotDurationMins: 60,
  });
  const [closureReasonOption, setClosureReasonOption] = useState<
    (typeof closureReasonOptions)[number]
  >("Holiday closure");
  const [closure, setClosure] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    displayReasonToCustomers: false,
  });

  const activeClosures = useMemo(
    () => ((availability?.closures as ClosureRecord[] | undefined) || []).filter((item) => item.active !== false),
    [availability?.closures],
  );

  async function saveTiming() {
    await api.post("/admin/availability/timing", timing);
    await queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
  }

  async function saveClosure() {
    const reason =
      closureReasonOption === "Custom reason"
        ? closure.reason
        : closureReasonOption;

    await api.post("/admin/availability/closures", {
      ...closure,
      reason,
    });
    await queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
    setClosure({
      startDate: "",
      endDate: "",
      reason: "",
      displayReasonToCustomers: false,
    });
    setClosureReasonOption("Holiday closure");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5 p-8">
          <div className="lux-heading text-2xl font-semibold text-[#231a13]">
            Global Timing
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              value={timing.openTime}
              onChange={(event: { target: { value: string } }) =>
                setTiming({ ...timing, openTime: event.target.value })
              }
              type="time"
            />
            <Input
              value={timing.closeTime}
              onChange={(event: { target: { value: string } }) =>
                setTiming({ ...timing, closeTime: event.target.value })
              }
              type="time"
            />
            <Input
              value={String(timing.slotDurationMins)}
              onChange={(event: { target: { value: string } }) =>
                setTiming({
                  ...timing,
                  slotDurationMins: Number(event.target.value),
                })
              }
              type="number"
              min="15"
              step="15"
              placeholder="Slot mins"
            />
          </div>
          <div className="text-sm text-[#554336]">
            Current: {availability?.timing?.openTime || "11:00"} -{" "}
            {availability?.timing?.closeTime || "22:00"}
          </div>
          <Button onClick={saveTiming}>Save Timing</Button>
        </Card>

        <Card className="space-y-5 p-8">
          <div className="lux-heading text-2xl font-semibold text-[#231a13]">
            Mark Unavailable
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={closure.startDate}
              onChange={(event: { target: { value: string } }) =>
                setClosure({ ...closure, startDate: event.target.value })
              }
              type="date"
            />
            <Input
              value={closure.endDate}
              onChange={(event: { target: { value: string } }) =>
                setClosure({ ...closure, endDate: event.target.value })
              }
              type="date"
            />
            <label className="space-y-2 text-sm text-[#554336] md:col-span-2">
              <span className="block text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Reason
              </span>
              <select
                value={closureReasonOption}
                onChange={(event) =>
                  setClosureReasonOption(
                    event.target.value as (typeof closureReasonOptions)[number],
                  )
                }
                className="h-12 w-full rounded-2xl border border-transparent bg-[#f4f0ec] px-4 text-sm text-[#231a13] outline-none"
              >
                {closureReasonOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            {closureReasonOption === "Custom reason" ? (
              <div className="md:col-span-2">
                <Input
                  value={closure.reason}
                  onChange={(event: { target: { value: string } }) =>
                    setClosure({ ...closure, reason: event.target.value })
                  }
                  placeholder="Custom reason"
                />
              </div>
            ) : null}
            <label className="flex items-center gap-3 md:col-span-2">
              <input
                type="checkbox"
                checked={closure.displayReasonToCustomers}
                onChange={(event) =>
                  setClosure({
                    ...closure,
                    displayReasonToCustomers: event.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-[#dcc2b1]"
              />
              <span className="text-sm text-[#554336]">
                Show selected reason to customers while booking
              </span>
            </label>
          </div>
          <Button onClick={saveClosure}>Save Unavailable Dates</Button>
        </Card>
      </div>

      <Card className="space-y-4 p-6">
        <div className="lux-heading text-2xl font-semibold text-[#231a13]">
          Active Unavailable Dates
        </div>
        {activeClosures.length ? (
          <div className="space-y-3">
            {activeClosures.map((closureItem, index) => (
              <div
                key={`${closureItem.startDate}-${closureItem.endDate}-${index}`}
                className="rounded-[24px] border border-[#e8d9cd] bg-[#fffaf5] p-4"
              >
                <div className="font-semibold text-[#231a13]">
                  {closureItem.startDate.slice(0, 10)} to{" "}
                  {closureItem.endDate.slice(0, 10)}
                </div>
                <div className="mt-1 text-sm text-[#554336]">
                  Reason: {closureItem.reason || "Unavailable"}
                </div>
                <div className="mt-1 text-sm text-[#8f4a00]">
                  {closureItem.displayReasonToCustomers
                    ? "Visible to customers"
                    : "Hidden from customers"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[#554336]">
            No unavailable dates configured.
          </div>
        )}
      </Card>
    </div>
  );
}
