"use client";

import { Button, Modal } from "@karali/ui";
import { api } from "../../lib/api";

export type BookingRecord = {
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

  return "Pay at venue";
}

export function BookingDetailsModal({
  booking,
  open,
  onClose,
  onCheckIn,
  pendingCheckIn,
}: {
  booking: BookingRecord | null;
  open: boolean;
  onClose: () => void;
  onCheckIn?: (bookingId: string) => void;
  pendingCheckIn?: boolean;
}) {
  return (
    <Modal
      open={open}
      title={booking ? `${booking.customerName} · ${booking.bookingId}` : "Booking Details"}
      className="max-w-3xl"
    >
      {booking ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Date
              </p>
              <p className="mt-1 font-medium text-[#231a13]">{booking.date}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Time
              </p>
              <p className="mt-1 font-medium text-[#231a13]">{booking.time}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Guests
              </p>
              <p className="mt-1 font-medium text-[#231a13]">{booking.pax}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Status
              </p>
              <p className="mt-1 font-medium text-[#231a13]">{booking.status}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Email
              </p>
              <p className="mt-1 break-all font-medium text-[#231a13]">
                {booking.email || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Phone
              </p>
              <p className="mt-1 break-all font-medium text-[#231a13]">
                {booking.phone || "-"}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#e8d9cd] bg-[#fff7f0] p-4 sm:p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
              Payment Summary
            </p>
            <p className="mt-2 text-lg font-semibold text-[#231a13]">
              {paymentLabel(booking)}
            </p>
            {booking.paymentStatus === "paid" && booking.totalAmount > 0 ? (
              <p className="mt-2 text-sm text-[#2d5e34]">
                {currency(booking.totalAmount)} has already been paid. Adjust
                this prepaid amount in the final bill.
              </p>
            ) : (
              <p className="mt-2 text-sm text-[#554336]">
                No advance payment was taken for this booking.
              </p>
            )}
          </div>

          {booking.paymentStatus === "paid" && booking.totalAmount > 0 ? (
            <details className="rounded-[24px] border border-[#d9eacb] bg-[#eef8e9] p-4 sm:p-5">
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">
                      Amount Received
                    </p>
                    <p className="mt-1 font-semibold text-[#1f4d28]">
                      {currency(booking.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">
                      Payment Status
                    </p>
                    <p className="mt-1 font-semibold text-[#1f4d28]">
                      {booking.paymentStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">
                      Internal Payment ID
                    </p>
                    <p className="mt-1 break-all font-medium text-[#1f4d28]">
                      {booking.paymentId || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">
                      Payment Reference ID
                    </p>
                    <p className="mt-1 break-all font-medium text-[#1f4d28]">
                      {booking.razorpayPaymentId || "-"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#2d5e34]/70">
                      Order Reference ID
                    </p>
                    <p className="mt-1 break-all font-medium text-[#1f4d28]">
                      {booking.razorpayOrderId || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void downloadReceipt(booking)}
                  >
                    Download Receipt
                  </Button>
                </div>
              </div>
            </details>
          ) : null}

          {booking.specialRequest ? (
            <div className="rounded-[24px] border border-[#e8d9cd] bg-white p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Special Request
              </p>
              <p className="mt-2 text-sm leading-7 text-[#231a13]">
                {booking.specialRequest}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
            {onCheckIn ? (
              <Button
                type="button"
                onClick={() => onCheckIn(booking.bookingId)}
                disabled={pendingCheckIn}
              >
                {pendingCheckIn ? "Checking In..." : "Mark Checked In"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
