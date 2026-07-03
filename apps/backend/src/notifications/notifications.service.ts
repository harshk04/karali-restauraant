import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  sendBookingNotification(payload?: { bookingId?: string; customerName?: string; phone?: string; date?: string; time?: string; pax?: number; qrCode?: string }) {
    return {
      status: "queued",
      channel: "whatsapp",
      payload,
    };
  }
}
