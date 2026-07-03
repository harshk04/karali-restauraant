"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type BookingStore = {
  currentStep: number;
  date?: string;
  time?: string;
  pax: number;
  guestName: string;
  email: string;
  phone: string;
  specialRequest: string;
  setStep: (step: number) => void;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  setPax: (pax: number) => void;
  setGuestName: (guestName: string) => void;
  setEmail: (email: string) => void;
  setPhone: (phone: string) => void;
  setSpecialRequest: (specialRequest: string) => void;
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      currentStep: 0,
      pax: 2,
      guestName: "",
      email: "",
      phone: "",
      specialRequest: "",
      setStep: (currentStep) => set({ currentStep }),
      setDate: (date) => set({ date }),
      setTime: (time) => set({ time }),
      setPax: (pax) => set({ pax }),
      setGuestName: (guestName) => set({ guestName }),
      setEmail: (email) => set({ email }),
      setPhone: (phone) => set({ phone }),
      setSpecialRequest: (specialRequest) => set({ specialRequest }),
    }),
    {
      name: "karali-booking-store",
      partialize: (state) => ({
        currentStep: state.currentStep,
        date: state.date,
        time: state.time,
        pax: state.pax,
        guestName: state.guestName,
        email: state.email,
        phone: state.phone,
        specialRequest: state.specialRequest,
      }),
    },
  ),
);
