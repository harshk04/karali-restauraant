import { Injectable } from "@nestjs/common";
import crypto from "crypto";
import { BookingsService } from "../bookings/bookings.service";

@Injectable()
export class QrService {
  constructor(private readonly bookingsService: BookingsService) {}

  async generate(bookingId: string) {
    const booking = await this.bookingsService.findByBookingId(bookingId);
    const payload = booking
      ? {
          bookingId: booking.bookingId,
          customerName: booking.customerName,
          date: booking.date,
          time: booking.time,
          pax: booking.pax,
          expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        }
      : {
          bookingId,
          customerName: "Guest",
          date: new Date().toISOString().slice(0, 10),
          time: "19:30",
          pax: 2,
          expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };

    const signature = crypto.createHmac("sha256", process.env.JWT_SECRET || "karali").update(JSON.stringify(payload)).digest("hex");

    return {
      ...payload,
      qrCode:
        booking?.qrCode ||
        `data:image/svg+xml;base64,${Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="black">${bookingId}</text></svg>`,
        ).toString("base64")}`,
      signature,
    };
  }
}
