"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, X } from "lucide-react";
import { Button, Card, Input, Modal } from "@karali/ui";
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
  paymentMethod: string;
  totalAmount: number;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  specialRequest?: string;
};

const visibleByDefaultStatuses = new Set(["pending", "confirmed"]);

function currency(amount: number) {
  return `Rs. ${Number(amount || 0).toFixed(0)}`;
}

async function downloadReceipt(booking: BookingRecord) {
  const response = await api.get(`/admin/bookings/${booking.bookingId}/receipt`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${booking.bookingId}-receipt.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

function paymentLabel(booking: BookingRecord) {
  if (booking.paymentStatus === "paid" && booking.totalAmount > 0) {
    return `Paid · ${currency(booking.totalAmount)} prepaid`;
  }

  if (booking.paymentMethod === "razorpay") {
    return "Online payment pending";
  }

  return "Pay at venue";
}

export default function AdminBookingsPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [pendingAction, setPendingAction] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [dateFilter, setDateFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    const scope = searchParams?.get("scope") || "active";
    const date = searchParams?.get("date") || "";
    const payment = searchParams?.get("payment") || "all";
    const query = searchParams?.get("search") || "";

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
      <Card className="space-y-4 p-6">
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
          <div className="grid gap-4 rounded-[24px] border border-[#e8d9cd] bg-[#fffaf5] p-4 md:grid-cols-4">
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

        <div className="overflow-x-auto">
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
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Button
                        type="button"
                        onClick={() => updateBooking(booking.bookingId, "check-in")}
                        disabled={pendingAction === `${booking.bookingId}:check-in`}
                      >
                        {pendingAction === `${booking.bookingId}:check-in`
                          ? "Working..."
                          : "Check In"}
                      </Button>
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
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6cbbb] bg-white text-[#9a3d21] transition-colors hover:bg-[#fff1e9]"
                        onClick={() => updateBooking(booking.bookingId, "cancel")}
                        disabled={pendingAction === `${booking.bookingId}:cancel`}
                        aria-label={`Cancel booking ${booking.bookingId}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
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

      <Modal
        open={Boolean(selectedBooking)}
        title={selectedBooking ? `${selectedBooking.customerName} · ${selectedBooking.bookingId}` : "Booking Details"}
        className="max-h-[90vh] max-w-3xl overflow-y-auto"
      >
        {selectedBooking ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                  Date
                </p>
                <p className="mt-1 font-medium text-[#231a13]">
                  {selectedBooking.date}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                  Time
                </p>
                <p className="mt-1 font-medium text-[#231a13]">
                  {selectedBooking.time}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                  Guests
                </p>
                <p className="mt-1 font-medium text-[#231a13]">
                  {selectedBooking.pax}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                  Status
                </p>
                <p className="mt-1 font-medium text-[#231a13]">
                  {selectedBooking.status}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                  Email
                </p>
                <p className="mt-1 break-all font-medium text-[#231a13]">
                  {selectedBooking.email || "-"}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                  Phone
                </p>
                <p className="mt-1 break-all font-medium text-[#231a13]">
                  {selectedBooking.phone || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e8d9cd] bg-[#fff7f0] p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Payment Summary
              </p>
              <p className="mt-2 text-lg font-semibold text-[#231a13]">
                {paymentLabel(selectedBooking)}
              </p>
              {selectedBooking.paymentStatus === "paid" &&
              selectedBooking.totalAmount > 0 ? (
                <p className="mt-2 text-sm text-[#2d5e34]">
                  {currency(selectedBooking.totalAmount)} has already been paid.
                  Adjust this prepaid amount in the final bill.
                </p>
              ) : (
                <p className="mt-2 text-sm text-[#554336]">
                  {selectedBooking.paymentMethod === "razorpay"
                    ? "No successful prepaid capture is recorded yet."
                    : "No advance payment was taken for this booking."}
                </p>
              )}
            </div>

            {selectedBooking.paymentStatus === "paid" &&
            selectedBooking.totalAmount > 0 ? (
              <details className="rounded-[24px] border border-[#d9eacb] bg-[#eef8e9] p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">
                      Receipt
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#1f4d28]">
                      View payment references and download receipt
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2d5e34]">
                    Open
                  </span>
                </summary>
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">
                        Amount Received
                      </p>
                      <p className="mt-1 font-semibold text-[#1f4d28]">
                        {currency(selectedBooking.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">
                        Payment Status
                      </p>
                      <p className="mt-1 font-semibold text-[#1f4d28]">
                        {selectedBooking.paymentStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">
                        Internal Payment ID
                      </p>
                      <p className="mt-1 break-all font-medium text-[#1f4d28]">
                        {selectedBooking.paymentId || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">
                        Razorpay Payment ID
                      </p>
                      <p className="mt-1 break-all font-medium text-[#1f4d28]">
                        {selectedBooking.razorpayPaymentId || "-"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">
                        Razorpay Order ID
                      </p>
                      <p className="mt-1 break-all font-medium text-[#1f4d28]">
                        {selectedBooking.razorpayOrderId || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void downloadReceipt(selectedBooking)}
                    >
                      Download Receipt
                    </Button>
                  </div>
                </div>
              </details>
            ) : null}

            {selectedBooking.specialRequest ? (
              <div className="rounded-[24px] border border-[#e8d9cd] bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                  Special Request
                </p>
                <p className="mt-2 text-sm leading-7 text-[#231a13]">
                  {selectedBooking.specialRequest}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => updateBooking(selectedBooking.bookingId, "check-in")}
                disabled={pendingAction === `${selectedBooking.bookingId}:check-in`}
              >
                {pendingAction === `${selectedBooking.bookingId}:check-in`
                  ? "Checking In..."
                  : "Mark Checked In"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
