import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Booking, BookingDocument } from "../database/schemas/booking.schema";
import { Availability, AvailabilityDocument } from "../database/schemas/availability.schema";
import { RestaurantTiming, RestaurantTimingDocument } from "../database/schemas/restaurant-timing.schema";
import { Closure, ClosureDocument } from "../database/schemas/closure.schema";

const DEFAULT_TIMES = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

@Injectable()
export class SlotsService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Availability.name) private readonly availabilityModel: Model<AvailabilityDocument>,
    @InjectModel(RestaurantTiming.name) private readonly timingModel: Model<RestaurantTimingDocument>,
    @InjectModel(Closure.name) private readonly closureModel: Model<ClosureDocument>,
  ) {}

  private async getTiming() {
    const [timing] = await this.timingModel.find().sort({ createdAt: -1 }).limit(1).lean();
    return timing || { openTime: "10:00", closeTime: "20:00", slotDurationMins: 60 };
  }

  private isDateInRange(date: string, startDate: string, endDate: string) {
    return date >= startDate && date <= endDate;
  }

  private async getDateState(date: string) {
    const closures = await this.closureModel.find({ active: true }).lean();
    const closure = closures.find((item) => this.isDateInRange(date, item.startDate, item.endDate));
    if (closure) {
      return { status: "closed", reason: closure.reason || "Restaurant closed" };
    }
    return { status: "open", reason: "" };
  }

  private toSlotLabel(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    const suffix = hours >= 12 ? "PM" : "AM";
    const normalizedHours = ((hours + 11) % 12) + 1;
    return `${normalizedHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
  }

  async calendar() {
    const today = new Date();
    return Promise.all(
      Array.from({ length: 30 }).map(async (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);
        const value = date.toISOString().slice(0, 10);
        const state = await this.getDateState(value);
        const bookingCount = await this.bookingModel.countDocuments({ date: value, status: { $ne: "cancelled" } });
        return {
          date: value,
          label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          status: state.status,
          reason: state.reason || (bookingCount >= 20 ? "Fully booked" : ""),
        };
      }),
    );
  }

  async slots(date: string) {
    const timing = await this.getTiming();
    const closureState = await this.getDateState(date);
    const availability = await this.availabilityModel.findOne({ scope: "date", date, active: true }).lean();
    const blockedSlots = new Set([
      ...(availability?.blockedSlots || []),
    ]);
    const existingBookings = await this.bookingModel.find({ date, status: { $ne: "cancelled" } }).lean();
    const counts = existingBookings.reduce<Record<string, number>>((acc, booking) => {
      acc[booking.time] = (acc[booking.time] || 0) + 1;
      return acc;
    }, {});
    const maxBookingsPerSlot = availability?.maxBookingsPerSlot || 6;

    if (closureState.status === "closed") {
      return {
        date,
        closed: true,
        reason: closureState.reason,
        slots: DEFAULT_TIMES.map((time) => ({
          time,
          label: this.toSlotLabel(time),
          available: false,
          reason: closureState.reason,
          bookings: counts[time] || 0,
        })),
      };
    }

    const openTime = availability?.startTime || timing.openTime || "10:00";
    const closeTime = availability?.endTime || timing.closeTime || "20:00";

    return {
      date,
      closed: false,
      openTime,
      closeTime,
      slots: DEFAULT_TIMES.filter((time) => time >= openTime && time <= closeTime).map((time) => {
        const bookings = counts[time] || 0;
        const available = !blockedSlots.has(time) && bookings < maxBookingsPerSlot;
        return {
          time,
          label: this.toSlotLabel(time),
          available,
          reason: blockedSlots.has(time) ? "Blocked by admin" : bookings >= maxBookingsPerSlot ? "Fully booked" : "",
          bookings,
          maxBookingsPerSlot,
        };
      }),
    };
  }
}
