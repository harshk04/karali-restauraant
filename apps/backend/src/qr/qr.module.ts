import { Module } from "@nestjs/common";
import { QrController } from "./qr.controller";
import { QrService } from "./qr.service";
import { BookingsModule } from "../bookings/bookings.module";

@Module({
  imports: [BookingsModule],
  controllers: [QrController],
  providers: [QrService],
})
export class QrModule {}
