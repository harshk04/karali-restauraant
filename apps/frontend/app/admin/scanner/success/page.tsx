"use client";

import { motion } from "framer-motion";
import { Button, Card } from "@karali/ui";
import { useSearchParams } from "next/navigation";

function currency(value?: string | null) {
  const amount = Number(value || 0);
  return `Rs. ${amount.toFixed(0)}`;
}

export default function ScannerSuccessPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams?.get("bookingId") || "";
  const customerName = searchParams?.get("customerName") || "Guest";
  const date = searchParams?.get("date") || "-";
  const time = searchParams?.get("time") || "-";
  const pax = searchParams?.get("pax") || "-";
  const status = searchParams?.get("status") || "checked_in";
  const paymentStatus = searchParams?.get("paymentStatus") || "pending";
  const paymentMethod = searchParams?.get("paymentMethod") || "pay_later";
  const totalAmount = searchParams?.get("totalAmount") || "0";
  const checkedInAt = searchParams?.get("checkedInAt");
  const prepaidAmount =
    paymentStatus === "paid" && Number(totalAmount || 0) > 0
      ? currency(totalAmount)
      : "";

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="lux-hero lux-reveal p-8 md:p-10"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="lux-eyebrow">Check-In Complete</p>
            <h2 className="lux-heading mt-3 text-4xl font-bold text-[#231a13]">
              Guest successfully checked in
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-[#554336]">
              Arrival has been confirmed and the table handoff is ready for the
              floor team.
            </p>
          </div>
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#8f4a00] text-5xl text-white shadow-[0_20px_50px_-12px_rgba(143,74,0,0.18)]">
            ✓
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-6 lg:grid-cols-12"
      >
        <Card className="lux-panel-strong space-y-8 p-8 lg:col-span-8">
          <div className="flex items-start justify-between border-b border-[#dcc2b1] pb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#554336]/60">
                Guest
              </p>
              <h3 className="lux-heading mt-1 text-[30px] font-bold text-[#231a13]">
                {customerName}
              </h3>
            </div>
            <div className="rounded-full bg-[#e4f6ea] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b6a36]">
              {status}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Booking ID
              </p>
              <p className="lux-heading mt-1 text-[20px] font-semibold text-[#231a13]">
                {bookingId || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Date
              </p>
              <p className="lux-heading mt-1 text-[20px] font-semibold text-[#231a13]">
                {date}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Time
              </p>
              <p className="lux-heading mt-1 text-[20px] font-semibold text-[#231a13]">
                {time}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Guests
              </p>
              <p className="lux-heading mt-1 text-[20px] font-semibold text-[#231a13]">
                {pax}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Payment Status
              </p>
              <p className="lux-heading mt-1 text-[20px] font-semibold text-[#231a13]">
                {paymentStatus}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/70">
                Checked In At
              </p>
              <p className="lux-heading mt-1 text-[20px] font-semibold text-[#231a13]">
                {checkedInAt ? new Date(checkedInAt).toLocaleString() : "Now"}
              </p>
            </div>
          </div>

          {prepaidAmount ? (
            <div className="rounded-[24px] border border-[#d9eacb] bg-[#eef8e9] p-6 text-[#2d5e34]">
              <div className="text-[11px] uppercase tracking-[0.25em] text-[#2d5e34]/70">
                Prepaid
              </div>
              <div className="mt-2 text-2xl font-semibold">{prepaidAmount}</div>
              <div className="mt-2 text-sm">
                This amount has already been collected and must be adjusted in
                the final bill.
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-[#e8d9cd] bg-[#fff7f0] p-6 text-[#554336]">
              <div className="text-[11px] uppercase tracking-[0.25em] text-[#554336]/70">
                Payment
              </div>
              <div className="mt-2 text-lg font-semibold text-[#231a13]">
                {paymentMethod === "razorpay"
                  ? "Online payment still pending"
                  : "No advance payment collected"}
              </div>
              <div className="mt-2 text-sm">
                {paymentMethod === "razorpay"
                  ? "The booking is checked in, but no prepaid amount has been captured yet."
                  : "Collect the full amount during final bill settlement."}
              </div>
            </div>
          )}
        </Card>

        <Card className="lux-panel-strong space-y-4 p-8 lg:col-span-4">
          <div className="text-sm uppercase tracking-[0.3em] text-[#8f4a00]">
            Next action
          </div>
          <div className="lux-heading text-2xl font-semibold text-[#231a13]">
            Continue floor operations
          </div>
          <p className="text-sm text-[#554336]">
            Return to the scanner for the next arrival or open bookings to
            manage more reservation actions.
          </p>
          <Button href="/admin/scanner" className="w-full">
            Scan Next Guest
          </Button>
          <Button href="/admin/bookings" variant="secondary" className="w-full">
            Open Bookings
          </Button>
        </Card>
      </motion.section>
    </div>
  );
}
