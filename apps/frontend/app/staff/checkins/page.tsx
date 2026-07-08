"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, DataTable, Input } from "@karali/ui";
import { staffApi } from "../../../lib/staff-api";

type CheckinRecord = {
  bookingId: string;
  customerName: string;
  phone: string;
  pax: number;
  tableNumber: string;
  checkedInBy: string;
  status: string;
  checkedInAt: string;
  time: string;
};

export default function StaffCheckinsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(today);
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["staff-checkins", search, date, sort, page],
    queryFn: async () =>
      (
        await staffApi.get<{ items: CheckinRecord[]; total: number; page: number; limit: number }>(
          "/staff/checkins",
          { params: { search, date, sort, page, limit: 10 } },
        )
      ).data,
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total || 0) / 10)),
    [data?.total],
  );

  return (
    <div className="space-y-6">
      <Card className="grid gap-4 md:grid-cols-4">
        <Input value={search} onChange={(event: { target: { value: string } }) => setSearch(event.target.value)} placeholder="Search bookings or guests" />
        <Input value={date} onChange={(event: { target: { value: string } }) => setDate(event.target.value)} type="date" />
        <select
          className="h-12 rounded-2xl border border-transparent bg-[#f4f0ec] px-4 text-[16px] text-[#231a13] outline-none"
          value={sort}
          onChange={(event) => setSort(event.target.value as "asc" | "desc")}
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
        <Button type="button" variant="secondary" onClick={() => { setSearch(""); setDate(today); setSort("desc"); setPage(1); }}>
          Reset
        </Button>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="lux-heading text-2xl font-semibold text-[#231a13]">Today's Check-ins</h2>
          <div className="text-sm text-[#554336]">{date}</div>
        </div>
        <DataTable
          columns={[
            { key: "time", label: "Time" },
            { key: "bookingId", label: "Booking ID" },
            { key: "customerName", label: "Customer" },
            { key: "phone", label: "Mobile" },
            { key: "pax", label: "Guests" },
            { key: "tableNumber", label: "Table" },
            { key: "checkedInBy", label: "Checked In By" },
            { key: "status", label: "Status" },
          ]}
          rows={data?.items || []}
        />
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </Button>
          <div className="text-sm text-[#554336]">
            Page {page} of {totalPages}
          </div>
          <Button type="button" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}
