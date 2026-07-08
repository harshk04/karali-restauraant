"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
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

type CalendarCell = {
  iso: string;
  date: Date;
  isCurrentMonth: boolean;
  availability?: CalendarDay;
  isPast: boolean;
};

const guestSchema = z.object({
  guestName: z.string().min(2, "Guest name is required."),
  email: z
    .union([z.string().email("Enter a valid email address."), z.literal("")])
    .default(""),
  phone: z
    .string()
    .trim()
    .regex(
      /^(?:\+91\d{10}|\d{10})$/,
      "Enter a mobile number as +91XXXXXXXXXX or XXXXXXXXXX.",
    ),
  specialRequest: z.string().default(""),
});

type GuestValues = z.infer<typeof guestSchema>;

const guestOptions = [
  { count: 1, label: "1" },
  { count: 2, label: "2" },
  { count: 3, label: "3" },
  { count: 4, label: "4" },
  { count: 5, label: "5" },
  { count: 6, label: "5+" },
] as const;

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const stepMotion = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
};

const RAZORPAY_PHASE_ONE_DISABLED = true;

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay is browser-only"));
  }
  if ((window as Window & { Razorpay?: unknown }).Razorpay) {
    return Promise.resolve();
  }
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Unable to load Razorpay checkout."));
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
}

function toSlotId(date?: string, time?: string) {
  if (!date || !time) return "";
  return `${date}-${time}`;
}

function to12Hour(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour = ((hours + 11) % 12) + 1;
  return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function getTimePeriodLabel(time: string) {
  const [hours] = time.split(":").map(Number);
  if (hours < 12) return "Morning";
  if (hours < 17) return "Afternoon";
  if (hours < 21) return "Evening";
  return "Late Night";
}

function getGuestDisplayLabel(pax: number) {
  return guestOptions.find((option) => option.count === pax)?.label || String(pax);
}

export function BookingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentStep,
    setStep,
    date,
    setDate,
    time,
    setTime,
    pax,
    setPax,
    guestName,
    email,
    phone,
    specialRequest,
    setGuestName,
    setEmail,
    setPhone,
    setSpecialRequest,
    resetBooking,
  } = useBookingStore();

  const [paymentPhase, setPaymentPhase] = useState<
    "idle" | "pay_later" | "razorpay" | "verifying" | "success" | "failure"
  >("idle");
  const [bookingError, setBookingError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [attemptId] = useState(() => createUniqueId());
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
  const ignoreNextAutoAdvanceRef = useRef(false);
  const previousStepRef = useRef(currentStep);

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
    queryFn: async () =>
      (
        await api.get<{ slots: SlotItem[]; closed?: boolean; reason?: string }>(
          "/slots",
          { params: { date } },
        )
      ).data,
    enabled: Boolean(date),
  });

  useEffect(() => {
    if (!searchParams) {
      resetBooking();
      setStep(1);
      return;
    }

    const hasPrefill = Boolean(
      searchParams.get("date") ||
        searchParams.get("time") ||
        searchParams.get("partySize"),
    );

    if (!hasPrefill) {
      resetBooking();
      setStep(1);
      return;
    }

    const queryDate = searchParams.get("date");
    const queryTime = searchParams.get("time");
    const queryPartySize = Number(searchParams.get("partySize") || "");

    if (queryDate) {
      setDate(queryDate);
    }

    if (queryTime) {
      setTime(queryTime);
    }

    if (Number.isFinite(queryPartySize) && queryPartySize > 0) {
      setPax(queryPartySize);
    }

    setStep(1);
  }, [resetBooking, searchParams, setDate, setPax, setStep, setTime]);

  useEffect(() => {
    if (ignoreNextAutoAdvanceRef.current) {
      ignoreNextAutoAdvanceRef.current = false;
      return;
    }

    if (time && currentStep < 3) {
      setStep(3);
      return;
    }

    if (date && currentStep < 2) {
      setStep(2);
    }
  }, [currentStep, date, setStep, time]);

  useEffect(() => {
    if (previousStepRef.current === currentStep) return;
    previousStepRef.current = currentStep;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  useEffect(() => {
    form.reset({ guestName, email, phone, specialRequest });
  }, [email, form, guestName, phone, specialRequest]);

  useEffect(() => {
    if (date) {
      setVisibleMonth(startOfMonth(parseISO(date)));
      return;
    }

    const firstAvailable = calendarQuery.data?.[0]?.date;
    if (firstAvailable) {
      setVisibleMonth(startOfMonth(parseISO(firstAvailable)));
    }
  }, [calendarQuery.data, date]);

  const selectedDateData = useMemo(
    () => calendarQuery.data?.find((day) => day.date === date),
    [calendarQuery.data, date],
  );

  const availableSlots = slotsQuery.data?.slots || [];

  const slotsByPeriod = useMemo(() => {
    return availableSlots.reduce<Record<string, SlotItem[]>>((groups, slot) => {
      const key = getTimePeriodLabel(slot.time);
      if (!groups[key]) groups[key] = [];
      groups[key].push(slot);
      return groups;
    }, {});
  }, [availableSlots]);

  const calendarMap = useMemo(() => {
    return new Map((calendarQuery.data || []).map((day) => [day.date, day]));
  }, [calendarQuery.data]);

  const calendarCells = useMemo<CalendarCell[]>(() => {
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const today = startOfDay(new Date());

    return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => {
      const iso = format(day, "yyyy-MM-dd");
      return {
        iso,
        date: day,
        isCurrentMonth: isSameMonth(day, visibleMonth),
        availability: calendarMap.get(iso),
        isPast: isBefore(day, today),
      };
    });
  }, [calendarMap, visibleMonth]);

  const slotId = toSlotId(date, time);
  const payableAmount = 0;

  async function selectDate(day: CalendarDay) {
    if (day.status !== "open") return;
    setDate(day.date);
    setTime("");
    setStep(2);
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
        couponCode: "",
        discountAmount: 0,
        totalAmount: 0,
      });

      setBookingId(response.data.bookingId);
      setPaymentPhase("success");
      router.push(
        `/booking/confirmed?bookingId=${encodeURIComponent(response.data.bookingId)}`,
      );
    } catch (error) {
      setBookingError(
        error instanceof Error ? error.message : "Booking failed.",
      );
      setPaymentPhase("failure");
    }
  }

  async function payNow() {
    // Phase 1: Razorpay remains in the codebase but is intentionally disabled.
    // We route every booking through the existing Pay Later flow until payment
    // is re-enabled.
    if (RAZORPAY_PHASE_ONE_DISABLED) {
      await bookNowPayLater();
      return;
    }

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
        couponCode: "",
      });

      const RazorpayCheckout = (
        window as Window & {
          Razorpay?: new (options: Record<string, unknown>) => {
            open: () => void;
          };
        }
      ).Razorpay;
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
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
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
            router.push(
              `/booking/confirmed?bookingId=${encodeURIComponent(createResponse.data.bookingId)}`,
            );
          } else {
            throw new Error("Payment verification failed.");
          }
        },
      });

      checkout.open();
    } catch (error) {
      setBookingError(
        error instanceof Error
          ? error.message
          : "Unable to start Razorpay checkout.",
      );
      setPaymentPhase("failure");
    }
  }

  function goBack() {
    if (currentStep <= 1) {
      router.push("/");
      return;
    }

    if (currentStep === 2) {
      setTime("");
      ignoreNextAutoAdvanceRef.current = true;
      setStep(1);
      return;
    }

    ignoreNextAutoAdvanceRef.current = true;
    setStep(currentStep - 1);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-start">
        <Button type="button" variant="secondary" onClick={goBack} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4" />
          {currentStep <= 1 ? "Back to Home" : "Back"}
        </Button>
      </div>

      <BookingStepper current={Math.max(0, currentStep - 1)} />

      <div className="grid gap-4 lg:grid-cols-12 xl:gap-6">
        <div className="space-y-6 lg:col-span-8">
          <AnimatePresence mode="wait">
            {currentStep <= 1 ? (
              <motion.div key="step-1" {...stepMotion}>
                <Card className="lux-panel-strong space-y-6 p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="lux-heading mt-2 text-3xl font-bold text-[#231a13]">
                        Choose your date
                      </h2>
                      <p className="mt-1 text-sm text-[#554336]">
                        Browse real availability and select the day that fits
                        your travel schedule.
                      </p>
                    </div>
                    <CalendarDays className="h-8 w-8 text-[#8f4a00]" />
                  </div>

                  <div className="rounded-[32px] border border-[#ead9ca] bg-white/80 p-3 sm:p-5">
                    <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="lux-heading text-xl font-semibold text-[#231a13] sm:text-2xl">
                          {format(visibleMonth, "MMMM yyyy")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleMonth((current) => subMonths(current, 1))
                          }
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e8d9cd] bg-[#fff8f3] text-[#8f4a00] transition-all hover:border-[#8f4a00]/40 hover:bg-white"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleMonth((current) => addMonths(current, 1))
                          }
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e8d9cd] bg-[#fff8f3] text-[#8f4a00] transition-all hover:border-[#8f4a00]/40 hover:bg-white"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] uppercase tracking-[0.08em] text-[#7c6758] sm:gap-2 sm:text-xs sm:tracking-[0.22em]">
                      {weekdayLabels.map((item) => (
                        <div key={item} className="py-1 sm:py-2">
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
                      {calendarCells.map((cell) => {
                        const isSelected = date
                          ? isSameDay(parseISO(date), cell.date)
                          : false;
                        const canBook =
                          cell.isCurrentMonth &&
                          !cell.isPast &&
                          cell.availability?.status === "open";
                        const isClosed =
                          cell.isCurrentMonth &&
                          cell.availability?.status === "closed";
                        const muted = !cell.isCurrentMonth || cell.isPast;

                        return (
                          <button
                            key={cell.iso}
                            type="button"
                            disabled={!canBook}
                            onClick={() =>
                              cell.availability
                                ? selectDate(cell.availability)
                                : undefined
                            }
                            className={[
                              "min-h-[64px] rounded-[14px] border p-1.5 text-left transition-all sm:min-h-[96px] sm:rounded-[24px] sm:p-3",
                              isSelected
                                ? "border-[#8f4a00] bg-[#8f4a00] text-white shadow-[0_16px_30px_-18px_rgba(143,74,0,0.85)]"
                                : "border-[#ead9ca] bg-[#fffaf7] text-[#231a13]",
                              canBook && !isSelected
                                ? "hover:-translate-y-0.5 hover:border-[#8f4a00]/45 hover:bg-white"
                                : "",
                              !canBook ? "cursor-not-allowed" : "",
                              muted ? "opacity-45" : "",
                              isClosed && !isSelected ? "bg-[#f8efe9]" : "",
                            ].join(" ")}
                          >
                              <div className="flex items-start justify-between gap-1 max-sm:flex-col max-sm:items-start">
                                <span className="text-xs font-semibold sm:text-sm">
                                  {format(cell.date, "d")}
                                </span>
                              {canBook ? (
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    isSelected ? "bg-white" : "bg-[#8f4a00]"
                                  } max-sm:self-end max-sm:mt-1`}
                                ></span>
                              ) : null}
                            </div>
                            <div
                              className={`mt-1 hidden text-[10px] sm:mt-7 sm:block sm:text-xs ${
                                isSelected
                                  ? "text-white/85"
                                  : "text-[#6d5a4c]"
                              }`}
                            >
                              {canBook
                                ? cell.availability?.label || "Open"
                                : isClosed
                                  ? cell.availability?.reason || "Closed"
                                  : cell.isCurrentMonth
                                    ? "Unavailable"
                                    : ""}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-5 text-sm text-[#554336]">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#8f4a00]"></span>
                        Available
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#d6b8a3]"></span>
                        Closed or fully booked
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : null}

            {currentStep === 2 ? (
              <motion.div key="step-2" {...stepMotion}>
                <Card className="lux-panel-strong space-y-6 p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="lux-heading mt-2 text-3xl font-bold text-[#231a13]">
                        Choose your time
                      </h2>
                      <p className="mt-1 text-sm text-[#554336]">
                        Select from live slots for{" "}
                        {date
                          ? format(parseISO(date), "EEEE, d MMMM")
                          : "your selected date"}
                        .
                      </p>
                    </div>
                    <Clock3 className="h-8 w-8 text-[#8f4a00]" />
                  </div>

                  <div className="rounded-[28px] border border-[#ead9ca] bg-white/75 p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-full bg-[#fff1e9] px-4 py-2 text-sm font-semibold text-[#8f4a00]">
                        {selectedDateData?.label ||
                          (date ? format(parseISO(date), "EEE, d MMM") : "")}
                      </div>
                      {/* <div className="text-sm text-[#554336]">
                        Real-time availability
                      </div> */}
                    </div>

                    {Object.keys(slotsByPeriod).length ? (
                      <div className="space-y-6">
                        {Object.entries(slotsByPeriod).map(([period, items]) => (
                          <div key={period}>
                            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#8f4a00]/75">
                              {period}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {items.map((item) => (
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
                                    "rounded-[20px] border p-4 text-left transition-all sm:rounded-[24px]",
                                    time === item.time
                                      ? "border-[#8f4a00] bg-[#8f4a00] text-white shadow-[0_16px_30px_-18px_rgba(143,74,0,0.85)]"
                                      : "border-[#ead9ca] bg-[#fffaf7] text-[#231a13]",
                                    item.available && time !== item.time
                                      ? "hover:-translate-y-0.5 hover:border-[#8f4a00]/45 hover:bg-white"
                                      : "",
                                    !item.available
                                      ? "cursor-not-allowed opacity-55"
                                      : "",
                                  ].join(" ")}
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="text-lg font-semibold">
                                        {to12Hour(item.time)}
                                      </div>
                                      <div
                                        className={`mt-1 text-sm ${
                                          time === item.time
                                            ? "text-white/85"
                                            : "text-[#6d5a4c]"
                                        }`}
                                      >
                                        {item.available
                                          ? ""
                                          : item.reason || "Unavailable"}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-[#dcc2b1] bg-[#fff8f4] p-6 text-sm text-[#6d5a4c]">
                        No live time slots are available for this date right
                        now. Please go back and choose another day.
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ) : null}

            {currentStep === 3 ? (
              <motion.div key="step-3" {...stepMotion}>
                <Card className="lux-panel-strong space-y-6 p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="lux-heading mt-2 text-3xl font-bold text-[#231a13]">
                        Select guest count
                      </h2>
                      <p className="mt-1 text-sm text-[#554336]">
                        Pick the table size that best matches your group.
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-[#8f4a00]" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-4">
                    {guestOptions.map((option) => (
                      <button
                        key={option.count}
                        type="button"
                        onClick={() => {
                          setPax(option.count);
                          setStep(4);
                        }}
                        className={[
                          "flex min-h-14 w-full items-center justify-center rounded-[24px] border text-center transition-all sm:h-16 sm:w-16 sm:rounded-full",
                          pax === option.count
                            ? "border-[#8f4a00] bg-[#8f4a00] text-white shadow-[0_16px_30px_-18px_rgba(143,74,0,0.85)]"
                            : "border-[#ead9ca] bg-[#fffaf7] text-[#231a13] hover:-translate-y-0.5 hover:border-[#8f4a00]/45 hover:bg-white",
                        ].join(" ")}
                      >
                        <div className="text-2xl font-semibold">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ) : null}

            {currentStep === 4 ? (
              <motion.div key="step-4" {...stepMotion}>
                <Card className="lux-panel-strong space-y-5 p-4 sm:p-6 lg:p-8">
                  <div>
                    <h2 className="lux-heading mt-2 text-3xl font-bold text-[#231a13]">
                      Guest information
                    </h2>
                    <p className="mt-1 text-sm text-[#554336]">
                      Tell us who is coming so we can send booking updates.
                    </p>
                  </div>
                  <form
                    className="grid gap-4 md:grid-cols-2"
                    onSubmit={form.handleSubmit(saveGuest)}
                  >
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-[#231a13]">
                        Name
                      </label>
                      <Input
                        {...form.register("guestName")}
                        placeholder="Guest name"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#231a13]">
                        Email
                      </label>
                      <Input
                        {...form.register("email")}
                        type="email"
                        placeholder="name@example.com"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#231a13]">
                        Mobile Number
                      </label>
                      <Input
                        {...form.register("phone")}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="9876543210"
                      />
                      {/* <p className="mt-2 text-xs text-[#554336]/75">
                        Use <span className="font-medium">+91 followed by 10 digits</span> or just{" "}
                        <span className="font-medium">10 digits</span>.
                      </p> */}
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-[#231a13]">
                        Special requests
                      </label>
                      <textarea
                        {...form.register("specialRequest")}
                        rows={4}
                        className="w-full rounded-2xl border border-transparent bg-[#f4f0ec] px-4 py-3 text-sm text-[#231a13] outline-none transition-all duration-300 placeholder:text-[#8e7f74] focus:border-[#c96a00]/30 focus:bg-white focus:shadow-[0_0_0_1.5px_#c96a00,0_0_18px_rgba(201,106,0,0.12)]"
                        placeholder="Allergy notes, celebration details, accessibility needs..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Button className="w-full" type="submit">
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            ) : null}

            {currentStep === 5 ? (
              <motion.div key="step-5" {...stepMotion}>
                <Card className="lux-panel-strong space-y-5 p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="lux-heading mt-2 text-3xl font-bold text-[#231a13]">
                        Review booking
                      </h2>
                    </div>
                    <ShieldCheck className="h-8 w-8 text-[#8f4a00]" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      ["Name", guestName || "-"],
                      [
                        "Date",
                        date
                          ? format(parseISO(date), "EEEE, d MMMM yyyy")
                          : "-",
                      ],
                      ["Time", time ? to12Hour(time) : "-"],
                      ["Guests", getGuestDisplayLabel(pax)],
                      ["Email", email || "-"],
                      ["Mobile", phone || "-"],
                      ["Special Request", specialRequest || "None"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-[#e8d9cd] bg-white p-4"
                      >
                        <div className="text-[11px] uppercase tracking-[0.2em] text-[#554336]/60">
                          {label}
                        </div>
                        <div className="mt-1 font-medium text-[#231a13]">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {bookingError ? (
                    <p className="text-sm text-[#b54646]">{bookingError}</p>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-2">
                    <Button
                      type="button"
                      onClick={bookNowPayLater}
                      disabled={
                        paymentPhase === "pay_later" ||
                        paymentPhase === "razorpay" ||
                        paymentPhase === "verifying"
                      }
                    >
                      {paymentPhase === "pay_later" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Reserve Now (Pay Later)
                    </Button>
                    {RAZORPAY_PHASE_ONE_DISABLED ? null : (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={payNow}
                        disabled={
                          paymentPhase === "pay_later" ||
                          paymentPhase === "razorpay" ||
                          paymentPhase === "verifying"
                        }
                      >
                        {paymentPhase === "razorpay" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Pay Cover Charge with Razorpay
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="space-y-6 lg:col-span-4">
          {currentStep === 5 ? (
            <Card className="lux-panel-strong sticky top-28 space-y-5 p-8">
              <h3 className="lux-heading text-[28px] font-bold text-[#231a13]">
                Booking Summary
              </h3>
              <div className="space-y-4 text-sm text-[#554336]">
                <div className="flex justify-between gap-4">
                  <span>Name</span>
                  <span>{guestName || "-"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Date</span>
                  <span>
                    {date ? format(parseISO(date), "d MMM yyyy") : "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Time</span>
                  <span>{time ? to12Hour(time) : "-"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Guests</span>
                  <span>{getGuestDisplayLabel(pax)}</span>
                </div>
                <div className="border-t border-[#e8d9cd] pt-4 text-sm text-[#554336]">
                  
                </div>
              </div>
            </Card>
          ) : null}

          {paymentPhase === "success" ? (
            <Card className="border-[#cfe9d6] bg-[#f6fff8] p-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-[#2d7a44]" />
                <div>
                  <h4 className="text-lg font-semibold text-[#231a13]">
                    Booking confirmed
                  </h4>
                  <p className="text-sm text-[#496652]">
                    Your reservation is ready. Booking ID: {bookingId}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          {paymentPhase === "failure" ? (
            <Card className="border-[#f0c8c8] bg-[#fff6f6] p-6">
              <div className="flex items-start gap-4">
                <XCircle className="h-6 w-6 text-[#b54646]" />
                <div>
                  <h4 className="text-lg font-semibold text-[#231a13]">
                    Action failed
                  </h4>
                  <p className="text-sm text-[#664646]">
                    {bookingError || "Something went wrong."}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
