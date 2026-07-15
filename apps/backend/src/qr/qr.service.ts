import { Injectable } from "@nestjs/common";
import { BookingsService } from "../bookings/bookings.service";

@Injectable()
export class QrService {
  constructor(private readonly bookingsService: BookingsService) {}

  async generate(bookingId: string, accessKey: string, shareToken?: string) {
    if (shareToken) {
      return this.bookingsService.getSharedQr(bookingId, shareToken);
    }

    return this.bookingsService.getPublicQr(bookingId, accessKey);
  }
}
