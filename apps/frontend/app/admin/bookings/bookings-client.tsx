"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, X } from "lucide-react";
import { Button, Card, Input } from "@karali/ui";
import { BookingDetailsModal, type BookingRecord } from "../../../features/admin/booking-details-modal";
import { api } from "../../../lib/api";

const visibleByDefaultStatuses = new Set(["pending", "confirmed"]);
const actionableCheckInStatuses = new Set(["pending", "confirmed"]);
const actionableCompleteStatuses = new Set(["checked_in"]);
const actionableCancelStatuses = new Set(["pending", "confirmed", "checked_in"]);

function currency(amount: number) {
  return `Rs. ${Number(amount || 0).toFixed(0)}`;
}

function paymentLabel(booking: BookingRecord) {
  if (booking.paymentStatus === "paid" && booking.totalAmount > 0) {
    return `Paid · ${currency(booking.totalAmount)} prepaid`;
  }

  return "Pay at venue";
}

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function AdminBookingsClient({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [pendingAction, setPendingAction] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [dateFilter, setDateFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    const scope = first(searchParams.scope) || "active";
    const date = first(searchParams.date) || "";
    const payment = first(searchParams.payment) || "all";
    const query = first(searchParams.search) || "";

    setStatusFilter(scope);
    setDateFilter(date);
    setPaymentFilter(payment);
    setSearch(query);
    setFilterOpen(Boolean(date || payment !== "all" || scope !== "active"));
  }, [searchParams]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-bookings", search],
    queryFn: async () =>
      (
        await api.get<BookingRecord[]>("/admin/bookings", {
          params: { search },
        })
      ).data,
  });

  async function updateBooking(
    bookingId: string,
    action: "check-in" | "complete" | "cancel",
  ) {
    setPendingAction(`${bookingId}:${action}`);
    try {
      await api.post(`/admin/bookings/${bookingId}/${action}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });

      if (selectedBooking?.bookingId === bookingId) {
        const refreshed = await api.get<BookingRecord[]>("/admin/bookings", {
          params: { search: bookingId },
        });
        const nextBooking =
          refreshed.data.find((booking) => booking.bookingId === bookingId) || null;
        setSelectedBooking(nextBooking);
      }
    } finally {
      setPendingAction("");
    }
  }

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((booking) => {
        const matchesStatus =
          statusFilter === "active"
            ? visibleByDefaultStatuses.has(booking.status)
            : statusFilter === "all"
              ? true
              : booking.status === statusFilter;

        const matchesDate = dateFilter ? booking.date === dateFilter : true;
        const matchesPayment =
          paymentFilter === "all"
            ? true
            : booking.paymentStatus === paymentFilter;

        return matchesStatus && matchesDate && matchesPayment;
      })
      .sort((left, right) => {
        if (left.date !== right.date) {
          return left.date.localeCompare(right.date);
        }

        return left.time.localeCompare(right.time);
      });
  }, [bookings, dateFilter, paymentFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={search}
              onChange={(event: { target: { value: string } }) =>
                setSearch(event.target.value)
              }
              placeholder="Search by booking ID, guest, phone, or email"
            />
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e8d9cd] bg-white text-[#8f4a00] shadow-[0_10px_25px_-18px_rgba(30,41,59,0.32)] transition-transform duration-300 hover:-translate-y-0.5"
              onClick={() => setFilterOpen((open) => !open)}
              aria-label="Toggle filters"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
          <Button href="/admin/manual-booking" variant="secondary">
            Add Booking
          </Button>
        </div>

        {filterOpen ? (
          <div className="grid gap-4 rounded-[24px] border border-[#e8d9cd] bg-[#fffaf5] p-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm text-[#554336]">
              <span className="block text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-2xl border border-[#dcc2b1] bg-white px-4 py-3 text-[#231a13] outline-none"
              >
                <option value="active">Active</option>
                <option value="all">All</option>
                <option value="checked_in">Checked In</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            <label className="space-y-2 text-sm text-[#554336]">
              <span className="block text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Date
              </span>
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-full rounded-2xl border border-[#dcc2b1] bg-white px-4 py-3 text-[#231a13] outline-none"
              />
            </label>

            <label className="space-y-2 text-sm text-[#554336]">
              <span className="block text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Payment
              </span>
              <select
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
                className="w-full rounded-2xl border border-[#dcc2b1] bg-white px-4 py-3 text-[#231a13] outline-none"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </label>

            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setStatusFilter("active");
                  setDateFilter("");
                  setPaymentFilter("all");
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-3 md:hidden">
          {filteredBookings.map((booking) => (
            <Card key={booking.bookingId} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <button
                    type="button"
                    className="font-semibold text-[#8f4a00] underline-offset-4 hover:underline"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    {booking.bookingId}
                  </button>
                  <div className="mt-1 text-sm font-medium text-[#231a13]">
                    {booking.customerName}
                  </div>
                </div>
                <div className="text-right text-sm text-[#554336]">
                  <div>{booking.date}</div>
                  <div>{booking.time}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/60">
                    Guests
                  </div>
                  <div className="mt-1 text-[#231a13]">{booking.pax}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/60">
                    Payment
                  </div>
                  <div className="mt-1 font-medium text-[#8f4a00]">
                    {paymentLabel(booking)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {actionableCheckInStatuses.has(booking.status) ? (
                  <Button
                    type="button"
                    onClick={() => updateBooking(booking.bookingId, "check-in")}
                    disabled={pendingAction === `${booking.bookingId}:check-in`}
                    className="w-full sm:w-auto"
                  >
                    {pendingAction === `${booking.bookingId}:check-in`
                      ? "Working..."
                      : "Check In"}
                  </Button>
                ) : null}
                {actionableCompleteStatuses.has(booking.status) ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => updateBooking(booking.bookingId, "complete")}
                    disabled={pendingAction === `${booking.bookingId}:complete`}
                    className="w-full sm:w-auto"
                  >
                    {pendingAction === `${booking.bookingId}:complete`
                      ? "Working..."
                      : "Complete"}
                  </Button>
                ) : null}
                {actionableCancelStatuses.has(booking.status) ? (
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center rounded-full border border-[#e6cbbb] bg-white text-[#9a3d21] transition-colors hover:bg-[#fff1e9] sm:w-11"
                    onClick={() => updateBooking(booking.bookingId, "cancel")}
                    disabled={pendingAction === `${booking.bookingId}:cancel`}
                    aria-label={`Cancel booking ${booking.bookingId}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#fff1e9]/90 text-xs uppercase tracking-[0.24em] text-[#554336]/60">
              <tr>
                {[
                  "Booking ID",
                  "Guest",
                  "Date",
                  "Time",
                  "Guests",
                  "Payment",
                  "Actions",
                ].map((label) => (
                  <th key={label} className="px-5 py-4 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.bookingId}
                  className="border-t border-black/5 transition-colors hover:bg-white/55"
                >
                  <td className="px-5 py-4 align-top">
                    <button
                      type="button"
                      className="font-semibold text-[#8f4a00] underline-offset-4 hover:underline"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      {booking.bookingId}
                    </button>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <button
                      type="button"
                      className="text-left font-medium text-[#231a13] underline-offset-4 hover:text-[#8f4a00] hover:underline"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      {booking.customerName}
                    </button>
                  </td>
                  <td className="px-5 py-4 align-top text-[#231a13]">
                    {booking.date}
                  </td>
                  <td className="px-5 py-4 align-top text-[#231a13]">
                    {booking.time}
                  </td>
                  <td className="px-5 py-4 align-top text-[#231a13]">
                    {booking.pax}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="font-medium text-[#8f4a00]">
                      {paymentLabel(booking)}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap items-center gap-2">
                      {actionableCheckInStatuses.has(booking.status) ? (
                        <Button
                          type="button"
                          onClick={() => updateBooking(booking.bookingId, "check-in")}
                          disabled={pendingAction === `${booking.bookingId}:check-in`}
                        >
                          {pendingAction === `${booking.bookingId}:check-in`
                            ? "Working..."
                            : "Check In"}
                        </Button>
                      ) : null}
                      {actionableCompleteStatuses.has(booking.status) ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => updateBooking(booking.bookingId, "complete")}
                          disabled={pendingAction === `${booking.bookingId}:complete`}
                        >
                          {pendingAction === `${booking.bookingId}:complete`
                            ? "Working..."
                            : "Complete"}
                        </Button>
                      ) : null}
                      {actionableCancelStatuses.has(booking.status) ? (
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6cbbb] bg-white text-[#9a3d21] transition-colors hover:bg-[#fff1e9]"
                          onClick={() => updateBooking(booking.bookingId, "cancel")}
                          disabled={pendingAction === `${booking.bookingId}:cancel`}
                          aria-label={`Cancel booking ${booking.bookingId}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredBookings.length ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-[#554336]"
                  >
                    {isLoading ? "Loading bookings..." : "No bookings found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <BookingDetailsModal
        booking={selectedBooking}
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        onCheckIn={
          selectedBooking && actionableCheckInStatuses.has(selectedBooking.status)
            ? (bookingId) => void updateBooking(bookingId, "check-in")
            : undefined
        }
        pendingCheckIn={Boolean(
          selectedBooking && pendingAction === `${selectedBooking.bookingId}:check-in`,
        )}
      />
    </div>
  );
}
