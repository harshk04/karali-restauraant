"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CalendarDays, CheckCircle2, Loader2, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { BookingStepper, Button, Card, Input } from "@karali/ui";
import { api } from "../../lib/api";
import { createUniqueId } from "../../lib/uuid";
import { useBookingStore } from "../../store/booking-store";

type CalendarDay = {
  date: string;
  label: string;
  status: "open" | "closed";
  reason?: string;
};

type SlotItem = {
  time: string;
  label: string;
  available: boolean;
  reason?: string;
  bookings: number;
};

type CouponResult = {
  coupon: { code: string; discountType: "percentage" | "fixed"; percentage: number; fixedAmount: number } | null;
  discount: number;
};

const guestSchema = z.object({
  guestName: z.string().min(2, "Guest name is required."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().regex(/^[+0-9()\-\s]{8,20}$/, "Enter a valid mobile number."),
  specialRequest: z.string().default(""),
});

type GuestValues = z.infer<typeof guestSchema>;

const guestCounts = [1, 2, 3, 4, 5, 6, 7, 8];

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("Razorpay is browser-only"));
  if ((window as Window & { Razorpay?: unknown }).Razorpay) return Promise.resolve();
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
}

function toSlotId(date?: string, time?: string) {
  if (!date || !time) return "";
  return `${date}-${time}`;
}

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function to12Hour(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour = ((hours + 11) % 12) + 1;
  return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function BookingFlow() {
  const router = useRouter();
  const { currentStep, setStep, date, setDate, time, setTime, pax, setPax, guestName, email, phone, specialRequest, setGuestName, setEmail, setPhone, setSpecialRequest } = useBookingStore();
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<CouponResult>({ coupon: null, discount: 0 });
  const [couponError, setCouponError] = useState("");
  const [paymentPhase, setPaymentPhase] = useState<"idle" | "pay_later" | "razorpay" | "verifying" | "success" | "failure">("idle");
  const [bookingError, setBookingError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [attemptId] = useState(() => createUniqueId());

  const form = useForm<GuestValues>({
    resolver: zodResolver(guestSchema) as never,
    defaultValues: { guestName, email, phone, specialRequest },
  });

  const calendarQuery = useQuery({
    queryKey: ["availability-calendar"],
    queryFn: async () => (await api.get<CalendarDay[]>("/slots/calendar")).data,
  });

  const slotsQuery = useQuery({
    queryKey: ["availability-slots", date],
    queryFn: async () => (await api.get<{ slots: SlotItem[]; closed?: boolean; reason?: string }>("/slots", { params: { date } })).data,
    enabled: Boolean(date),
  });

  useEffect(() => {
    setStep(1);
  }, [setStep]);

  useEffect(() => {
    if (date && currentStep < 2) setStep(2);
  }, [currentStep, date, setStep]);

  useEffect(() => {
    if (time && currentStep < 3) setStep(3);
  }, [currentStep, setStep, time]);

  useEffect(() => {
    form.reset({ guestName, email, phone, specialRequest });
  }, [email, form, guestName, phone, specialRequest]);

  const selectedDateData = useMemo(() => calendarQuery.data?.find((day) => day.date === date), [calendarQuery.data, date]);
  const availableSlots = slotsQuery.data?.slots || [];

  const subtotal = useMemo(() => pax * 750, [pax]);
  const payableAmount = Math.max(0, subtotal - couponResult.discount);
  const slotId = toSlotId(date, time);

  async function selectDate(day: CalendarDay) {
    if (day.status !== "open") return;
    setDate(day.date);
    setTime("");
    setStep(2);
  }

  async function applyCoupon() {
    setCouponError("");
    if (!couponCode.trim()) {
      setCouponResult({ coupon: null, discount: 0 });
      return;
    }

    try {
      const response = await api.get<CouponResult>("/coupons/validate", { params: { code: couponCode.trim(), amount: payableAmount || subtotal } });
      if (!response.data?.coupon) {
        setCouponError("Coupon is invalid or expired.");
        setCouponResult({ coupon: null, discount: 0 });
        return;
      }
      setCouponResult(response.data);
    } catch {
      setCouponError("Unable to validate coupon right now.");
    }
  }

  async function saveGuest(values: GuestValues) {
    setGuestName(values.guestName);
    setEmail(values.email);
    setPhone(values.phone);
    setSpecialRequest(values.specialRequest || "");
    setStep(5);
  }

  async function bookNowPayLater() {
    if (!date || !time) return;
    setPaymentPhase("pay_later");
    setBookingError("");
    try {
      const response = await api.post("/bookings", {
        customerName: guestName,
        email,
        phone,
        slotId,
        pax,
        specialRequest,
        paymentMethod: "pay_later",
        couponCode: couponResult.coupon?.code || couponCode || "",
        discountAmount: couponResult.discount,
        totalAmount: payableAmount,
      });

      setBookingId(response.data.bookingId);
      setPaymentPhase("success");
      router.push(`/booking/confirmed?bookingId=${encodeURIComponent(response.data.bookingId)}`);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Booking failed.");
      setPaymentPhase("failure");
    }
  }

  async function payNow() {
    if (!date || !time) return;
    setPaymentPhase("razorpay");
    setBookingError("");

    try {
      await loadRazorpayScript();
      const createResponse = await api.post("/payments/razorpay/create-order", {
        customerName: guestName,
        email,
        phone,
        slotId,
        pax,
        specialRequest,
        amount: payableAmount,
        attemptId,
        couponCode: couponResult.coupon?.code || couponCode || "",
      });

      const RazorpayCheckout = (window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      if (!RazorpayCheckout) {
        throw new Error("Razorpay checkout is unavailable.");
      }

      const checkout = new RazorpayCheckout({
        key: createResponse.data.keyId,
        amount: createResponse.data.amount,
        currency: createResponse.data.currency,
        name: "Karali Restaurant",
        description: `Reservation for ${guestName}`,
        order_id: createResponse.data.orderId,
        prefill: { name: guestName, email, contact: phone },
        theme: { color: "#8f4a00" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          setPaymentPhase("verifying");
          const verify = await api.post("/payments/razorpay/verify", {
            bookingId: createResponse.data.bookingId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            userId: createResponse.data.userId,
          });
          if (verify.data?.success) {
            setBookingId(createResponse.data.bookingId);
            setPaymentPhase("success");
            router.push(`/booking/confirmed?bookingId=${encodeURIComponent(createResponse.data.bookingId)}`);
          } else {
            throw new Error("Payment verification failed.");
          }
        },
      });

      checkout.open();
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Unable to start Razorpay checkout.");
      setPaymentPhase("failure");
    }
  }

  return (
    <div className="space-y-6">
      <BookingStepper current={Math.max(0, currentStep - 1)} />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {currentStep <= 1 ? (
            <Card className="space-y-5 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-[#8f4a00]/70">Step 1</p>
                  <h2 className="mt-2 text-3xl font-bold text-[#231a13]">Select Date</h2>
                  <p className="mt-1 text-sm text-[#554336]">Choose an open date. Closed and fully booked dates are disabled.</p>
                </div>
                <CalendarDays className="h-8 w-8 text-[#8f4a00]" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {calendarQuery.data?.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    disabled={day.status !== "open"}
                    onClick={() => selectDate(day)}
                    className={[
                      "rounded-3xl border p-4 text-left transition-all",
                      date === day.date ? "border-[#8f4a00] bg-[#fff1e9]" : "border-[#e8d9cd] bg-white",
                      day.status !== "open" ? "cursor-not-allowed opacity-60" : "hover:border-[#8f4a00]/40",
                    ].join(" ")}
                  >
                    <div className="text-xs uppercase tracking-[0.2em] text-[#554336]/60">{day.label}</div>
                    <div className="mt-2 text-lg font-semibold text-[#231a13]">{new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    <div className="mt-2 text-sm text-[#554336]">{day.status === "open" ? "Available" : day.reason || "Unavailable"}</div>
                  </button>
                ))}
              </div>
            </Card>
          ) : null}

          {currentStep === 2 ? (
            <Card className="space-y-5 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-[#8f4a00]/70">Step 2</p>
                  <h2 className="mt-2 text-3xl font-bold text-[#231a13]">Select Time</h2>
                  <p className="mt-1 text-sm text-[#554336]">Availability updates in real time from the backend.</p>
                </div>
                <Sparkles className="h-8 w-8 text-[#8f4a00]" />
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {availableSlots.map((item) => (
                  <button
                    key={item.time}
                    type="button"
                    disabled={!item.available}
                    onClick={() => {
                      if (!item.available) return;
                      setTime(item.time);
                      setStep(3);
                    }}
                    className={[
                      "rounded-3xl border p-4 text-left transition-all",
                      time === item.time ? "border-[#8f4a00] bg-[#fff1e9]" : "border-[#e8d9cd] bg-white",
                      !item.available ? "cursor-not-allowed opacity-60" : "hover:border-[#8f4a00]/40",
                    ].join(" ")}
                  >
                    <div className="text-lg font-semibold text-[#231a13]">{to12Hour(item.time)}</div>
                    <div className="mt-1 text-sm text-[#554336]">{item.available ? `${Math.max(0, 6 - item.bookings)} seats left` : item.reason || "Unavailable"}</div>
                  </button>
                ))}
              </div>
            </Card>
          ) : null}

          {currentStep === 3 ? (
            <Card className="space-y-5 p-8">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#8f4a00]/70">Step 3</p>
                <h2 className="mt-2 text-3xl font-bold text-[#231a13]">Number of Guests</h2>
                <p className="mt-1 text-sm text-[#554336]">Select how many guests you’re booking for.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {guestCounts.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setPax(count);
                      setStep(4);
                    }}
                    className={[
                      "rounded-3xl border px-5 py-6 text-left transition-all",
                      pax === count ? "border-[#8f4a00] bg-[#fff1e9]" : "border-[#e8d9cd] bg-white hover:border-[#8f4a00]/40",
                    ].join(" ")}
                  >
                    <div className="text-3xl font-bold text-[#231a13]">{count}</div>
                    <div className="mt-1 text-sm text-[#554336]">{count === 1 ? "Guest" : "Guests"}</div>
                  </button>
                ))}
              </div>
            </Card>
          ) : null}

          {currentStep === 4 ? (
            <Card className="space-y-5 p-8">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#8f4a00]/70">Step 4</p>
                <h2 className="mt-2 text-3xl font-bold text-[#231a13]">Guest Information</h2>
                <p className="mt-1 text-sm text-[#554336]">Tell us who is coming so we can send booking updates.</p>
              </div>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(saveGuest)}>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#231a13]">Name</label>
                  <Input {...form.register("guestName")} placeholder="Guest name" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#231a13]">Email</label>
                  <Input {...form.register("email")} type="email" placeholder="name@example.com" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#231a13]">Mobile Number</label>
                  <Input {...form.register("phone")} placeholder="+91 98765 43210" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#231a13]">Special Requests</label>
                  <textarea
                    {...form.register("specialRequest")}
                    rows={4}
                    className="w-full rounded-xl border-0 bg-slate-100 px-4 py-3 text-sm outline-none focus:bg-white focus:shadow-[0_0_0_1.5px_#c96a00,0_0_8px_rgba(201,106,0,0.15)]"
                    placeholder="Allergy notes, celebration details, accessibility needs..."
                  />
                </div>
                <div className="md:col-span-2">
                  <Button className="w-full" type="submit">
                    Save Guest Details
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Card>
          ) : null}

          {currentStep === 5 ? (
            <Card className="space-y-5 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-[#8f4a00]/70">Step 5</p>
                  <h2 className="mt-2 text-3xl font-bold text-[#231a13]">Review Booking</h2>
                </div>
                <ShieldCheck className="h-8 w-8 text-[#8f4a00]" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Date", date ? new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "-"],
                  ["Time", time ? to12Hour(time) : "-"],
                  ["Guests", String(pax)],
                  ["Name", guestName || "-"],
                  ["Email", email || "-"],
                  ["Mobile", phone || "-"],
                  ["Special Request", specialRequest || "None"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[#e8d9cd] bg-white p-4">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/60">{label}</div>
                    <div className="mt-1 font-medium text-[#231a13]">{value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-[#e8d9cd] bg-[#fff9f4] p-5">
                <label className="mb-2 block text-sm font-medium text-[#231a13]">Coupon Code</label>
                <div className="flex gap-3">
                  <Input value={couponCode} onChange={(event: { target: { value: string } }) => setCouponCode(event.target.value)} placeholder="Enter coupon code" />
                  <Button type="button" variant="secondary" onClick={applyCoupon}>
                    Apply
                  </Button>
                </div>
                {couponError ? <p className="mt-2 text-sm text-[#b54646]">{couponError}</p> : null}
                <div className="mt-4 flex items-center justify-between text-sm text-[#554336]">
                  <span>Subtotal</span>
                  <span>{currency(subtotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-[#554336]">
                  <span>Discount</span>
                  <span>-{currency(couponResult.discount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-base font-semibold text-[#231a13]">
                  <span>Total</span>
                  <span>{currency(payableAmount)}</span>
                </div>
              </div>

              {bookingError ? <p className="text-sm text-[#b54646]">{bookingError}</p> : null}

              <div className="grid gap-3 md:grid-cols-2">
                <Button type="button" onClick={bookNowPayLater} disabled={paymentPhase === "pay_later" || paymentPhase === "razorpay" || paymentPhase === "verifying"}>
                  {paymentPhase === "pay_later" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Book Now (Pay Later)
                </Button>
                <Button type="button" variant="secondary" onClick={payNow} disabled={paymentPhase === "pay_later" || paymentPhase === "razorpay" || paymentPhase === "verifying"}>
                  {paymentPhase === "razorpay" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Pay Now with Razorpay
                </Button>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card className="sticky top-28 space-y-5 p-8">
            <h3 className="text-[28px] font-bold text-[#231a13]">Booking Summary</h3>
            <div className="space-y-4 text-sm text-[#554336]">
              <div className="flex justify-between gap-4">
                <span>Date</span>
                <span>{selectedDateData?.label || "Select a date"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Time</span>
                <span>{time ? to12Hour(time) : "Select a time"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Guests</span>
                <span>{pax}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Guest</span>
                <span>{guestName || "Add details"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Coupon</span>
                <span>{couponResult.coupon?.code || couponCode || "None"}</span>
              </div>
              <div className="border-t border-[#e8d9cd] pt-4">
                <div className="flex justify-between text-base">
                  <span>Amount</span>
                  <span className="font-semibold text-[#8f4a00]">{currency(payableAmount)}</span>
                </div>
              </div>
            </div>
          </Card>

          {paymentPhase === "success" ? (
            <Card className="border-[#cfe9d6] bg-[#f6fff8] p-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-[#2d7a44]" />
                <div>
                  <h4 className="text-lg font-semibold text-[#231a13]">Booking confirmed</h4>
                  <p className="text-sm text-[#496652]">Your reservation is ready. Booking ID: {bookingId}</p>
                </div>
              </div>
            </Card>
          ) : null}

          {paymentPhase === "failure" ? (
            <Card className="border-[#f0c8c8] bg-[#fff6f6] p-6">
              <div className="flex items-start gap-4">
                <XCircle className="h-6 w-6 text-[#b54646]" />
                <div>
                  <h4 className="text-lg font-semibold text-[#231a13]">Action failed</h4>
                  <p className="text-sm text-[#664646]">{bookingError || "Something went wrong."}</p>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
