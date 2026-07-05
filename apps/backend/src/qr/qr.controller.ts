import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { QrService } from "./qr.service";

@Controller("qr")
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get(":bookingId")
  getQr(@Param("bookingId") bookingId: string) {
    return this.qrService.generate(bookingId);
  }

  @Get(":bookingId/image")
  async getQrImage(
    @Param("bookingId") bookingId: string,
    @Res() res: Response,
  ) {
    const qr = await this.qrService.generate(bookingId);
    if (!qr.qrCode?.startsWith("data:image")) {
      throw new NotFoundException("QR image not found.");
    }

    const [meta, encoded] = qr.qrCode.split(",", 2);
    const mimeType = meta.match(/data:(.*?);base64/)?.[1] || "image/png";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(Buffer.from(encoded || "", "base64"));
  }
}
