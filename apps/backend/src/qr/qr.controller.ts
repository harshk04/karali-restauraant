import { Controller, Get, Param } from "@nestjs/common";
import { QrService } from "./qr.service";

@Controller("qr")
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get(":bookingId")
  getQr(@Param("bookingId") bookingId: string) {
    return this.qrService.generate(bookingId);
  }
}
