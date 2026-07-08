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
  _id?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  entireDay?: boolean;
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
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [durationMode, setDurationMode] = useState<"entire" | "partial">("entire");
  const [closureReasonOption, setClosureReasonOption] = useState<
    (typeof closureReasonOptions)[number]
  >("Holiday closure");
  const [closure, setClosure] = useState({
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    reason: "",
    displayReasonToCustomers: false,
  });

  const activeClosures = useMemo(
    () => ((availability?.closures as ClosureRecord[] | undefined) || []).filter((item) => item.active !== false),
    [availability?.closures],
  );

  const closureSummary = useMemo(() => {
    if (!closure.startDate) {
      return "Choose a date or date range to begin.";
    }

    const datePart =
      dateMode === "single" || !closure.endDate || closure.endDate === closure.startDate
        ? closure.startDate
        : `${closure.startDate} to ${closure.endDate}`;

    if (durationMode === "entire") {
      return `${datePart}, entire day`;
    }

    return `${datePart}, ${closure.startTime || "--:--"} to ${closure.endTime || "--:--"}`;
  }, [closure.endDate, closure.endTime, closure.startDate, closure.startTime, dateMode, durationMode]);

  const canSaveClosure = useMemo(() => {
    if (!closure.startDate) {
      return false;
    }
    if (dateMode === "range" && !closure.endDate) {
      return false;
    }
    if (durationMode === "partial" && (!closure.startTime || !closure.endTime)) {
      return false;
    }
    if (closureReasonOption === "Custom reason" && !closure.reason.trim()) {
      return false;
    }
    return true;
  }, [closure.endDate, closure.endTime, closure.reason, closure.startDate, closure.startTime, closureReasonOption, dateMode, durationMode]);

  async function saveTiming() {
    await api.post("/admin/availability/timing", timing);
    await queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
  }

  async function saveClosure() {
    const reason =
      closureReasonOption === "Custom reason"
        ? closure.reason
        : closureReasonOption;
    const endDate =
      dateMode === "single"
        ? closure.startDate
        : closure.endDate || closure.startDate;

    await api.post("/admin/availability/closures", {
      startDate: closure.startDate,
      endDate,
      entireDay: durationMode === "entire",
      startTime: durationMode === "partial" ? closure.startTime : "",
      endTime: durationMode === "partial" ? closure.endTime : "",
      reason,
      displayReasonToCustomers: closure.displayReasonToCustomers,
    });
    await queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
    setClosure({
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      reason: "",
      displayReasonToCustomers: false,
    });
    setDateMode("single");
    setDurationMode("entire");
    setClosureReasonOption("Holiday closure");
  }

  async function undoClosure(closureId?: string) {
    if (!closureId) {
      return;
    }

    await api.patch(`/admin/availability/closures/${encodeURIComponent(closureId)}/undo`);
    await queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="lux-heading text-2xl font-semibold text-[#231a13]">
          Mark Unavailable
        </div>
        <div className="space-y-5">
          <div className="rounded-[28px] border border-[#e8d9cd] bg-[#fffaf5] p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-[#8f4a00]">
              Step 1
            </div>
            <div className="mt-2 text-sm font-medium text-[#231a13]">
              Pick a date or date range
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={dateMode === "single" ? "primary" : "secondary"}
                onClick={() => setDateMode("single")}
              >
                Single date
              </Button>
              <Button
                type="button"
                variant={dateMode === "range" ? "primary" : "secondary"}
                onClick={() => setDateMode("range")}
              >
                Date range
              </Button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                value={closure.startDate}
                onChange={(event: { target: { value: string } }) => {
                  const nextStartDate = event.target.value;
                  setClosure({
                    ...closure,
                    startDate: nextStartDate,
                    endDate:
                      dateMode === "single" ? nextStartDate : closure.endDate,
                  });
                }}
                type="date"
                placeholder="Start date"
              />
              <Input
                value={dateMode === "single" ? closure.startDate : closure.endDate}
                onChange={(event: { target: { value: string } }) =>
                  setClosure({ ...closure, endDate: event.target.value })
                }
                type="date"
                placeholder={dateMode === "single" ? "Single date" : "End date"}
                disabled={dateMode === "single"}
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-[#e8d9cd] bg-[#fffaf5] p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-[#8f4a00]">
              Step 2
            </div>
            <div className="mt-2 text-sm font-medium text-[#231a13]">
              Choose entire day or partial hours
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={durationMode === "entire" ? "primary" : "secondary"}
                onClick={() => setDurationMode("entire")}
              >
                Entire duration
              </Button>
              <Button
                type="button"
                variant={durationMode === "partial" ? "primary" : "secondary"}
                onClick={() => setDurationMode("partial")}
              >
                Partial hours
              </Button>
            </div>
            {durationMode === "partial" ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input
                  value={closure.startTime}
                  onChange={(event: { target: { value: string } }) =>
                    setClosure({ ...closure, startTime: event.target.value })
                  }
                  type="time"
                  placeholder="Start time"
                />
                <Input
                  value={closure.endTime}
                  onChange={(event: { target: { value: string } }) =>
                    setClosure({ ...closure, endTime: event.target.value })
                  }
                  type="time"
                  placeholder="End time"
                />
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-[#e8d9cd] bg-[#fffaf5] p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-[#8f4a00]">
              Step 3
            </div>
            <div className="mt-2 text-sm font-medium text-[#231a13]">
              Add a reason and customer visibility
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-[#554336] sm:col-span-2">
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
                  className="h-12 w-full rounded-2xl border border-transparent bg-[#f4f0ec] px-4 text-[16px] text-[#231a13] outline-none sm:text-sm"
                >
                  {closureReasonOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              {closureReasonOption === "Custom reason" ? (
                <div className="sm:col-span-2">
                  <Input
                    value={closure.reason}
                    onChange={(event: { target: { value: string } }) =>
                      setClosure({ ...closure, reason: event.target.value })
                    }
                    placeholder="Custom reason"
                  />
                </div>
              ) : null}
              <label className="flex items-center gap-3 rounded-2xl border border-[#efd9c8] bg-white px-4 py-3 sm:col-span-2">
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
                  Show this reason to customers
                </span>
              </label>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#e8d9cd] bg-[#231a13] p-4 text-white">
            <div className="text-xs uppercase tracking-[0.3em] text-[#f6d0a9]">
              Preview
            </div>
            <div className="mt-2 text-sm">{closureSummary}</div>
            <div className="mt-1 text-sm text-white/70">
              {closureReasonOption === "Custom reason"
                ? closure.reason || "Custom reason"
                : closureReasonOption}{" "}
              {closure.displayReasonToCustomers
                ? "will be shown to customers."
                : "will stay hidden from customers."}
            </div>
          </div>
        </div>
        <Button onClick={saveClosure} disabled={!canSaveClosure}>
          Save Unavailable Dates
        </Button>
      </Card>

      <Card className="space-y-4 p-4 sm:p-6">
        <div className="lux-heading text-2xl font-semibold text-[#231a13]">
          Active Unavailable Dates
        </div>
        {activeClosures.length ? (
          <div className="space-y-3">
            {activeClosures.map((closureItem, index) => (
              <div
                key={closureItem._id || `${closureItem.startDate}-${closureItem.endDate}-${index}`}
                className="rounded-[24px] border border-[#e8d9cd] bg-[#fffaf5] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-semibold text-[#231a13]">
                      {closureItem.startDate.slice(0, 10)}
                      {closureItem.endDate && closureItem.endDate !== closureItem.startDate
                        ? ` to ${closureItem.endDate.slice(0, 10)}`
                        : ""}
                    </div>
                    <div className="mt-1 text-sm text-[#554336]">
                      {closureItem.entireDay !== false
                        ? "Entire day unavailable"
                        : `Partial hours: ${closureItem.startTime || "--:--"} to ${closureItem.endTime || "--:--"}`}
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
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => undoClosure(closureItem._id)}
                    disabled={!closureItem._id}
                  >
                    Undo
                  </Button>
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

      <details>
        <Card className="overflow-hidden p-0">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#8f4a00]">
                Global Timing
              </div>
              <div className="mt-1 text-lg font-semibold text-[#231a13]">
                Current: {availability?.timing?.openTime || "11:00"} -{" "}
                {availability?.timing?.closeTime || "22:00"}
              </div>
              <div className="mt-1 text-sm text-[#554336]">
                Open to adjust opening hours and slot duration.
              </div>
            </div>
            <span className="rounded-full bg-[#fff1e9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8f4a00]">
              Toggle
            </span>
          </summary>
          <div className="border-t border-[#e8d9cd] p-4 sm:p-6 lg:p-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[#554336]">
                Current: {availability?.timing?.openTime || "11:00"} -{" "}
                {availability?.timing?.closeTime || "22:00"}
              </div>
              <Button onClick={saveTiming} className="w-full sm:w-auto">
                Save Timing
              </Button>
            </div>
          </div>
        </Card>
      </details>
    </div>
  );
}
